"""Background worker for processing scan requests."""

import logging
import asyncio
import json
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

from app.services.redis_service import redis_service
from app.services.detection_service import detection_service
from app.core.config import settings

logger = logging.getLogger(__name__)


class ScanProcessor:
    """Background processor for scan requests."""
    
    def __init__(self):
        self.is_running = False
        self.processed_count = 0
        self.error_count = 0
        self.start_time = None
        
        # Queue names
        self.scan_queue = "scan_requests"
        self.batch_queue = "batch_requests"
        self.priority_queue = "priority_requests"
        
    async def start(self):
        """Start the background processor."""
        if self.is_running:
            logger.warning("Scan processor already running")
            return
        
        self.is_running = True
        self.start_time = datetime.now()
        logger.info("Starting scan processor...")
        
        try:
            # Start multiple processing tasks
            tasks = [
                asyncio.create_task(self._process_priority_queue()),
                asyncio.create_task(self._process_scan_queue()),
                asyncio.create_task(self._process_batch_queue()),
                asyncio.create_task(self._cleanup_expired_items())
            ]
            
            # Wait for all tasks
            await asyncio.gather(*tasks, return_exceptions=True)
            
        except Exception as e:
            logger.error(f"Error in scan processor: {e}")
        finally:
            self.is_running = False
            logger.info("Scan processor stopped")
    
    async def stop(self):
        """Stop the background processor."""
        self.is_running = False
        logger.info("Stopping scan processor...")
    
    async def add_scan_request(
        self,
        request_data: Dict[str, Any],
        priority: str = "normal"
    ) -> bool:
        """
        Add a scan request to the processing queue.
        
        Args:
            request_data: Scan request data
            priority: Request priority (normal, high)
            
        Returns:
            True if added successfully
        """
        try:
            # Add timestamp and metadata
            enhanced_request = {
                **request_data,
                "queued_at": datetime.now().isoformat(),
                "priority": priority,
                "retry_count": 0
            }
            
            # Choose queue based on priority
            queue_name = self.priority_queue if priority == "high" else self.scan_queue
            
            success = await redis_service.add_to_queue(queue_name, enhanced_request)
            
            if success:
                logger.info(f"Added scan request to {queue_name} queue")
            else:
                logger.error(f"Failed to add scan request to {queue_name} queue")
            
            return success
            
        except Exception as e:
            logger.error(f"Error adding scan request: {e}")
            return False
    
    async def add_batch_request(self, batch_data: Dict[str, Any]) -> bool:
        """
        Add a batch processing request to the queue.
        
        Args:
            batch_data: Batch processing data
            
        Returns:
            True if added successfully
        """
        try:
            enhanced_batch = {
                **batch_data,
                "queued_at": datetime.now().isoformat(),
                "retry_count": 0
            }
            
            success = await redis_service.add_to_queue(self.batch_queue, enhanced_batch)
            
            if success:
                logger.info(f"Added batch request to queue: {batch_data.get('batch_id')}")
            
            return success
            
        except Exception as e:
            logger.error(f"Error adding batch request: {e}")
            return False
    
    async def get_processor_stats(self) -> Dict[str, Any]:
        """Get processor statistics."""
        try:
            uptime = (datetime.now() - self.start_time).total_seconds() if self.start_time else 0
            
            # Get queue lengths
            scan_queue_length = await redis_service.get_queue_length(self.scan_queue)
            batch_queue_length = await redis_service.get_queue_length(self.batch_queue)
            priority_queue_length = await redis_service.get_queue_length(self.priority_queue)
            
            return {
                "is_running": self.is_running,
                "uptime_seconds": uptime,
                "processed_count": self.processed_count,
                "error_count": self.error_count,
                "processing_rate": self.processed_count / max(uptime / 60, 1),  # per minute
                "queue_lengths": {
                    "scan_queue": scan_queue_length,
                    "batch_queue": batch_queue_length,
                    "priority_queue": priority_queue_length
                },
                "error_rate": self.error_count / max(self.processed_count, 1)
            }
            
        except Exception as e:
            logger.error(f"Error getting processor stats: {e}")
            return {"error": str(e)}
    
    async def _process_priority_queue(self):
        """Process high-priority requests."""
        logger.info("Starting priority queue processor")
        
        while self.is_running:
            try:
                # Get item from priority queue
                item = await redis_service.get_from_queue(self.priority_queue, timeout=1)
                
                if item:
                    await self._process_scan_item(item, is_priority=True)
                else:
                    # No items, wait a bit
                    await asyncio.sleep(0.5)
                    
            except Exception as e:
                logger.error(f"Error in priority queue processor: {e}")
                await asyncio.sleep(1)
    
    async def _process_scan_queue(self):
        """Process normal scan requests."""
        logger.info("Starting scan queue processor")
        
        while self.is_running:
            try:
                # Get item from scan queue
                item = await redis_service.get_from_queue(self.scan_queue, timeout=2)
                
                if item:
                    await self._process_scan_item(item)
                else:
                    # No items, wait a bit longer
                    await asyncio.sleep(1)
                    
            except Exception as e:
                logger.error(f"Error in scan queue processor: {e}")
                await asyncio.sleep(2)
    
    async def _process_batch_queue(self):
        """Process batch requests."""
        logger.info("Starting batch queue processor")
        
        while self.is_running:
            try:
                # Get item from batch queue
                item = await redis_service.get_from_queue(self.batch_queue, timeout=5)
                
                if item:
                    await self._process_batch_item(item)
                else:
                    # No items, wait longer for batch processing
                    await asyncio.sleep(2)
                    
            except Exception as e:
                logger.error(f"Error in batch queue processor: {e}")
                await asyncio.sleep(3)
    
    async def _process_scan_item(self, item: Dict[str, Any], is_priority: bool = False):
        """Process a single scan item."""
        try:
            request_id = item.get("request_id", "unknown")
            text = item.get("text", "")
            
            if not text:
                logger.warning(f"Empty text in scan request {request_id}")
                return
            
            logger.info(f"Processing {'priority ' if is_priority else ''}scan request: {request_id}")
            
            # Perform analysis
            result = await detection_service.analyze_text(
                text=text,
                include_explanation=item.get("include_explanation", True),
                include_evidence=item.get("include_evidence", True),
                use_cache=True,
                user_context=item.get("user_context")
            )
            
            # Store result
            await self._store_scan_result(request_id, result)
            
            # Send callback if provided
            if item.get("callback_url"):
                await self._send_callback(item["callback_url"], result)
            
            self.processed_count += 1
            logger.info(f"Completed scan request: {request_id}")
            
        except Exception as e:
            self.error_count += 1
            logger.error(f"Error processing scan item: {e}")
            
            # Handle retry logic
            await self._handle_scan_retry(item, str(e))
    
    async def _process_batch_item(self, item: Dict[str, Any]):
        """Process a batch item."""
        try:
            batch_id = item.get("batch_id", "unknown")
            texts = item.get("texts", [])
            
            if not texts:
                logger.warning(f"Empty texts in batch request {batch_id}")
                return
            
            logger.info(f"Processing batch request: {batch_id} ({len(texts)} items)")
            
            # Process batch
            result = await detection_service.batch_analyze(
                texts=texts,
                batch_id=batch_id,
                include_explanation=item.get("include_explanation", False),
                callback_url=item.get("callback_url"),
                priority=item.get("priority", "normal")
            )
            
            self.processed_count += len(texts)
            logger.info(f"Completed batch request: {batch_id}")
            
        except Exception as e:
            self.error_count += 1
            logger.error(f"Error processing batch item: {e}")
            
            # Handle batch retry logic
            await self._handle_batch_retry(item, str(e))
    
    async def _store_scan_result(self, request_id: str, result: Dict[str, Any]):
        """Store scan result in Redis."""
        try:
            cache_key = f"scan_result:{request_id}"
            success = await redis_service.set_cache(
                cache_key, 
                result, 
                expire=3600  # 1 hour
            )
            
            if not success:
                logger.warning(f"Failed to store scan result for {request_id}")
            
        except Exception as e:
            logger.error(f"Error storing scan result: {e}")
    
    async def _send_callback(self, callback_url: str, result: Dict[str, Any]):
        """Send callback to provided URL."""
        try:
            import httpx
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    callback_url,
                    json=result,
                    timeout=30.0,
                    headers={"Content-Type": "application/json"}
                )
                
                if response.status_code == 200:
                    logger.info(f"Callback sent successfully to {callback_url}")
                else:
                    logger.warning(f"Callback failed with status {response.status_code}")
                    
        except Exception as e:
            logger.error(f"Error sending callback to {callback_url}: {e}")
    
    async def _handle_scan_retry(self, item: Dict[str, Any], error: str):
        """Handle retry logic for failed scan items."""
        try:
            retry_count = item.get("retry_count", 0)
            max_retries = 3
            
            if retry_count < max_retries:
                # Increment retry count and re-queue
                item["retry_count"] = retry_count + 1
                item["last_error"] = error
                item["retry_at"] = (datetime.now() + timedelta(minutes=retry_count + 1)).isoformat()
                
                # Add to appropriate queue
                queue_name = self.priority_queue if item.get("priority") == "high" else self.scan_queue
                await redis_service.add_to_queue(queue_name, item)
                
                logger.info(f"Retry {retry_count + 1}/{max_retries} queued for scan request")
            else:
                # Max retries reached, store error result
                error_result = {
                    "status": "failed",
                    "error": error,
                    "retry_count": retry_count,
                    "failed_at": datetime.now().isoformat()
                }
                
                request_id = item.get("request_id")
                if request_id:
                    await self._store_scan_result(request_id, error_result)
                
                logger.error(f"Max retries reached for scan request, marking as failed")
                
        except Exception as e:
            logger.error(f"Error handling scan retry: {e}")
    
    async def _handle_batch_retry(self, item: Dict[str, Any], error: str):
        """Handle retry logic for failed batch items."""
        try:
            retry_count = item.get("retry_count", 0)
            max_retries = 2  # Fewer retries for batch processing
            
            if retry_count < max_retries:
                # Increment retry count and re-queue
                item["retry_count"] = retry_count + 1
                item["last_error"] = error
                item["retry_at"] = (datetime.now() + timedelta(minutes=(retry_count + 1) * 5)).isoformat()
                
                await redis_service.add_to_queue(self.batch_queue, item)
                
                logger.info(f"Retry {retry_count + 1}/{max_retries} queued for batch request")
            else:
                # Max retries reached, update batch status
                batch_id = item.get("batch_id")
                if batch_id:
                    error_status = {
                        "batch_id": batch_id,
                        "status": "failed",
                        "error": error,
                        "retry_count": retry_count,
                        "failed_at": datetime.now().isoformat()
                    }
                    
                    await redis_service.set_batch_status(batch_id, error_status)
                
                logger.error(f"Max retries reached for batch request, marking as failed")
                
        except Exception as e:
            logger.error(f"Error handling batch retry: {e}")
    
    async def _cleanup_expired_items(self):
        """Clean up expired cache items and old results."""
        logger.info("Starting cleanup processor")
        
        while self.is_running:
            try:
                # Clean up every 10 minutes
                await asyncio.sleep(600)
                
                if not self.is_running:
                    break
                
                # In a real implementation, this would:
                # 1. Remove expired scan results
                # 2. Clean up old batch statuses
                # 3. Remove stale cache entries
                # 4. Log cleanup statistics
                
                logger.info("Performed periodic cleanup")
                
            except Exception as e:
                logger.error(f"Error in cleanup processor: {e}")
                await asyncio.sleep(60)  # Shorter sleep on error