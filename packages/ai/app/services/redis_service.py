"""Redis service for caching and pub/sub functionality."""

import logging
import json
import asyncio
from typing import Any, Dict, List, Optional, Union
import redis.asyncio as redis
from redis.asyncio.connection import ConnectionPool
from datetime import datetime, timedelta

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisService:
    """Async Redis service for caching and messaging."""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.connection_pool: Optional[ConnectionPool] = None
        self.is_connected = False
        
    async def connect(self) -> bool:
        """Connect to Redis server."""
        try:
            # Create connection pool
            self.connection_pool = ConnectionPool.from_url(
                settings.REDIS_URL,
                db=settings.REDIS_DB,
                max_connections=settings.REDIS_POOL_SIZE,
                decode_responses=True
            )
            
            # Create Redis client
            self.redis_client = redis.Redis(connection_pool=self.connection_pool)
            
            # Test connection
            await self.redis_client.ping()
            self.is_connected = True
            
            logger.info("Successfully connected to Redis")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            self.is_connected = False
            return False
    
    async def disconnect(self):
        """Disconnect from Redis server."""
        try:
            if self.redis_client:
                await self.redis_client.close()
            if self.connection_pool:
                await self.connection_pool.disconnect()
            
            self.is_connected = False
            logger.info("Disconnected from Redis")
            
        except Exception as e:
            logger.error(f"Error disconnecting from Redis: {e}")
    
    async def set_cache(
        self,
        key: str,
        value: Any,
        expire: int = 3600,
        serialize: bool = True
    ) -> bool:
        """
        Set a value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            expire: Expiration time in seconds
            serialize: Whether to JSON serialize the value
            
        Returns:
            True if successful
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return False
        
        try:
            if serialize:
                value = json.dumps(value, default=str)
            
            await self.redis_client.set(key, value, ex=expire)
            return True
            
        except Exception as e:
            logger.error(f"Error setting cache key {key}: {e}")
            return False
    
    async def get_cache(
        self,
        key: str,
        deserialize: bool = True
    ) -> Optional[Any]:
        """
        Get a value from cache.
        
        Args:
            key: Cache key
            deserialize: Whether to JSON deserialize the value
            
        Returns:
            Cached value or None
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return None
        
        try:
            value = await self.redis_client.get(key)
            
            if value is None:
                return None
            
            if deserialize:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            
            return value
            
        except Exception as e:
            logger.error(f"Error getting cache key {key}: {e}")
            return None
    
    async def delete_cache(self, key: str) -> bool:
        """
        Delete a key from cache.
        
        Args:
            key: Cache key to delete
            
        Returns:
            True if successful
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return False
        
        try:
            result = await self.redis_client.delete(key)
            return result > 0
            
        except Exception as e:
            logger.error(f"Error deleting cache key {key}: {e}")
            return False
    
    async def cache_analysis_result(
        self,
        text_hash: str,
        result: Dict[str, Any],
        expire: int = 3600
    ) -> bool:
        """
        Cache analysis result.
        
        Args:
            text_hash: Hash of the analyzed text
            result: Analysis result to cache
            expire: Cache expiration in seconds
            
        Returns:
            True if successful
        """
        cache_key = f"analysis:{text_hash}"
        
        # Add timestamp to result
        cached_result = {
            **result,
            "cached_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(seconds=expire)).isoformat()
        }
        
        return await self.set_cache(cache_key, cached_result, expire)
    
    async def get_cached_analysis(self, text_hash: str) -> Optional[Dict[str, Any]]:
        """
        Get cached analysis result.
        
        Args:
            text_hash: Hash of the text
            
        Returns:
            Cached analysis result or None
        """
        cache_key = f"analysis:{text_hash}"
        return await self.get_cache(cache_key)
    
    async def set_batch_status(
        self,
        batch_id: str,
        status: Dict[str, Any],
        expire: int = 86400  # 24 hours
    ) -> bool:
        """
        Set batch processing status.
        
        Args:
            batch_id: Batch identifier
            status: Status information
            expire: Expiration time in seconds
            
        Returns:
            True if successful
        """
        cache_key = f"batch:{batch_id}"
        return await self.set_cache(cache_key, status, expire)
    
    async def get_batch_status(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """
        Get batch processing status.
        
        Args:
            batch_id: Batch identifier
            
        Returns:
            Status information or None
        """
        cache_key = f"batch:{batch_id}"
        return await self.get_cache(cache_key)
    
    async def increment_counter(self, key: str, increment: int = 1) -> int:
        """
        Increment a counter.
        
        Args:
            key: Counter key
            increment: Amount to increment
            
        Returns:
            New counter value
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return 0
        
        try:
            return await self.redis_client.incr(key, increment)
            
        except Exception as e:
            logger.error(f"Error incrementing counter {key}: {e}")
            return 0
    
    async def get_counter(self, key: str) -> int:
        """
        Get counter value.
        
        Args:
            key: Counter key
            
        Returns:
            Counter value
        """
        try:
            value = await self.get_cache(key, deserialize=False)
            return int(value) if value else 0
            
        except (ValueError, TypeError):
            return 0
    
    async def set_rate_limit(
        self,
        identifier: str,
        limit: int,
        window: int = 60
    ) -> bool:
        """
        Set rate limit for an identifier.
        
        Args:
            identifier: Rate limit identifier (IP, user, etc.)
            limit: Request limit
            window: Time window in seconds
            
        Returns:
            True if within limit, False if exceeded
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return True  # Allow if Redis unavailable
        
        try:
            key = f"rate_limit:{identifier}"
            current = await self.redis_client.incr(key)
            
            if current == 1:
                await self.redis_client.expire(key, window)
            
            return current <= limit
            
        except Exception as e:
            logger.error(f"Error checking rate limit for {identifier}: {e}")
            return True  # Allow on error
    
    async def publish_message(self, channel: str, message: Dict[str, Any]) -> bool:
        """
        Publish message to a channel.
        
        Args:
            channel: Channel name
            message: Message to publish
            
        Returns:
            True if successful
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return False
        
        try:
            message_str = json.dumps(message, default=str)
            await self.redis_client.publish(channel, message_str)
            return True
            
        except Exception as e:
            logger.error(f"Error publishing to channel {channel}: {e}")
            return False
    
    async def subscribe_to_channel(self, channel: str, callback):
        """
        Subscribe to a channel.
        
        Args:
            channel: Channel name
            callback: Callback function for messages
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return
        
        try:
            pubsub = self.redis_client.pubsub()
            await pubsub.subscribe(channel)
            
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        await callback(data)
                    except Exception as e:
                        logger.error(f"Error processing message from {channel}: {e}")
                        
        except Exception as e:
            logger.error(f"Error subscribing to channel {channel}: {e}")
    
    async def add_to_queue(self, queue_name: str, item: Dict[str, Any]) -> bool:
        """
        Add item to a queue.
        
        Args:
            queue_name: Queue name
            item: Item to add
            
        Returns:
            True if successful
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return False
        
        try:
            item_str = json.dumps(item, default=str)
            await self.redis_client.lpush(queue_name, item_str)
            return True
            
        except Exception as e:
            logger.error(f"Error adding to queue {queue_name}: {e}")
            return False
    
    async def get_from_queue(
        self,
        queue_name: str,
        timeout: int = 1
    ) -> Optional[Dict[str, Any]]:
        """
        Get item from a queue.
        
        Args:
            queue_name: Queue name
            timeout: Timeout in seconds
            
        Returns:
            Queue item or None
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return None
        
        try:
            result = await self.redis_client.brpop(queue_name, timeout=timeout)
            
            if result:
                _, item_str = result
                return json.loads(item_str)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting from queue {queue_name}: {e}")
            return None
    
    async def get_queue_length(self, queue_name: str) -> int:
        """
        Get queue length.
        
        Args:
            queue_name: Queue name
            
        Returns:
            Queue length
        """
        if not self.is_connected or not self.redis_client:
            logger.warning("Redis not connected")
            return 0
        
        try:
            return await self.redis_client.llen(queue_name)
            
        except Exception as e:
            logger.error(f"Error getting queue length for {queue_name}: {e}")
            return 0
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Perform Redis health check.
        
        Returns:
            Health status information
        """
        try:
            if not self.is_connected or not self.redis_client:
                return {
                    "status": "disconnected",
                    "error": "Redis client not connected"
                }
            
            # Test basic operations
            start_time = datetime.now()
            await self.redis_client.ping()
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            # Get Redis info
            info = await self.redis_client.info()
            
            return {
                "status": "healthy",
                "response_time_ms": response_time,
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory_human", "unknown"),
                "uptime_seconds": info.get("uptime_in_seconds", 0),
                "redis_version": info.get("redis_version", "unknown")
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Global Redis service instance
redis_service = RedisService()