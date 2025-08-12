"""Pattern matching for known scam phrases and indicators."""

import re
import logging
from typing import List, Dict, Tuple, Set
import numpy as np
from dataclasses import dataclass
from enum import Enum

from app.core.config import model_config

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk levels for pattern matches."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class PatternMatch:
    """Represents a pattern match with metadata."""
    pattern: str
    matches: List[str]
    risk_level: RiskLevel
    confidence: float
    category: str
    description: str


class ScamPatternMatcher:
    """Advanced pattern matcher for scam detection."""
    
    def __init__(self):
        self.patterns = self._initialize_patterns()
        self.compiled_patterns = self._compile_patterns()
        
    def _initialize_patterns(self) -> Dict[str, Dict]:
        """Initialize comprehensive scam patterns by category."""
        return {
            # Financial Investment Scams
            "investment_scams": {
                "patterns": [
                    (r"guaranteed\s+(?:returns?|profits?|income)", RiskLevel.CRITICAL),
                    (r"risk\s*-?\s*free\s+(?:investment|trading|opportunity)", RiskLevel.CRITICAL),
                    (r"double\s+your\s+money\s+in\s+\d+\s+(?:days?|weeks?|months?)", RiskLevel.CRITICAL),
                    (r"(?:200|300|500|1000)%\s+(?:return|profit|guaranteed)", RiskLevel.CRITICAL),
                    (r"ponzi\s+scheme", RiskLevel.CRITICAL),
                    (r"pyramid\s+scheme", RiskLevel.CRITICAL),
                    (r"binary\s+options\s+trading", RiskLevel.HIGH),
                    (r"forex\s+trading\s+(?:robot|bot|system)", RiskLevel.HIGH),
                    (r"insider\s+(?:trading|information)", RiskLevel.HIGH),
                    (r"stock\s+pump\s+and\s+dump", RiskLevel.HIGH),
                ],
                "description": "Investment and trading scams"
            },
            
            # Cryptocurrency Scams
            "crypto_scams": {
                "patterns": [
                    (r"bitcoin\s+(?:giveaway|doubler|investment)", RiskLevel.CRITICAL),
                    (r"ethereum\s+(?:giveaway|doubler)", RiskLevel.CRITICAL),
                    (r"crypto\s+(?:mining|investment)\s+(?:guaranteed|profits?)", RiskLevel.HIGH),
                    (r"send\s+(?:bitcoin|btc|ethereum|eth)\s+get\s+(?:double|triple)", RiskLevel.CRITICAL),
                    (r"elon\s+musk\s+(?:bitcoin|crypto)\s+giveaway", RiskLevel.CRITICAL),
                    (r"rug\s+pull\s+(?:crypto|token)", RiskLevel.HIGH),
                    (r"pump\s+and\s+dump\s+(?:crypto|coin)", RiskLevel.HIGH),
                    (r"defi\s+(?:guaranteed|risk-free)", RiskLevel.HIGH),
                    (r"nft\s+(?:guaranteed|investment|profits?)", RiskLevel.MEDIUM),
                ],
                "description": "Cryptocurrency-related scams"
            },
            
            # Romance/Social Engineering Scams
            "romance_scams": {
                "patterns": [
                    (r"need\s+money\s+for\s+(?:emergency|medical|travel)", RiskLevel.HIGH),
                    (r"western\s+union\s+(?:transfer|money)", RiskLevel.HIGH),
                    (r"money\s*gram\s+transfer", RiskLevel.HIGH),
                    (r"gift\s+cards?\s+(?:payment|money|transfer)", RiskLevel.HIGH),
                    (r"i\s+love\s+you\s+(?:but|and)\s+need", RiskLevel.MEDIUM),
                    (r"military\s+(?:deployment|overseas)\s+money", RiskLevel.MEDIUM),
                    (r"stranded\s+(?:abroad|overseas)\s+need\s+money", RiskLevel.HIGH),
                    (r"inheritance\s+money\s+(?:help|transfer)", RiskLevel.MEDIUM),
                ],
                "description": "Romance and social engineering scams"
            },
            
            # Phishing and Account Scams
            "phishing_scams": {
                "patterns": [
                    (r"verify\s+your\s+(?:account|identity)\s+(?:immediately|now)", RiskLevel.CRITICAL),
                    (r"account\s+(?:suspended|locked|compromised)", RiskLevel.HIGH),
                    (r"confirm\s+your\s+(?:details|information|payment)", RiskLevel.HIGH),
                    (r"update\s+your\s+(?:password|payment|billing)", RiskLevel.HIGH),
                    (r"click\s+here\s+to\s+(?:verify|confirm|update)", RiskLevel.HIGH),
                    (r"suspicious\s+activity\s+detected", RiskLevel.HIGH),
                    (r"unauthorized\s+(?:access|transaction|login)", RiskLevel.MEDIUM),
                    (r"security\s+alert\s+(?:urgent|immediate)", RiskLevel.MEDIUM),
                ],
                "description": "Phishing and account verification scams"
            },
            
            # Tech Support Scams
            "tech_support_scams": {
                "patterns": [
                    (r"microsoft\s+(?:support|security|windows)", RiskLevel.HIGH),
                    (r"apple\s+support\s+(?:urgent|security)", RiskLevel.HIGH),
                    (r"computer\s+(?:infected|virus|malware)", RiskLevel.HIGH),
                    (r"call\s+(?:this\s+number|immediately)\s+\+?[\d\-\(\)\s]+", RiskLevel.HIGH),
                    (r"remote\s+access\s+(?:required|needed)", RiskLevel.HIGH),
                    (r"firewall\s+(?:breach|compromised)", RiskLevel.MEDIUM),
                    (r"trojan\s+(?:detected|virus|malware)", RiskLevel.MEDIUM),
                ],
                "description": "Tech support scams"
            },
            
            # Lottery and Prize Scams
            "lottery_scams": {
                "patterns": [
                    (r"you\s+(?:have\s+)?won\s+\$?[\d,]+", RiskLevel.HIGH),
                    (r"lottery\s+(?:winner|prize|jackpot)", RiskLevel.HIGH),
                    (r"congratulations\s+you\s+(?:won|selected)", RiskLevel.MEDIUM),
                    (r"claim\s+your\s+(?:prize|winnings|reward)", RiskLevel.MEDIUM),
                    (r"processing\s+fee\s+(?:required|needed)", RiskLevel.HIGH),
                    (r"tax\s+(?:payment|fee)\s+(?:required|needed)", RiskLevel.HIGH),
                ],
                "description": "Lottery and prize scams"
            },
            
            # Job and Employment Scams
            "job_scams": {
                "patterns": [
                    (r"work\s+from\s+home\s+(?:\$\d+|\d+\$)", RiskLevel.MEDIUM),
                    (r"easy\s+money\s+(?:guaranteed|opportunity)", RiskLevel.MEDIUM),
                    (r"envelope\s+stuffing\s+(?:job|work)", RiskLevel.MEDIUM),
                    (r"mystery\s+shopper\s+(?:job|opportunity)", RiskLevel.MEDIUM),
                    (r"data\s+entry\s+(?:\$\d+|\d+\$)\s+(?:per\s+hour|daily)", RiskLevel.MEDIUM),
                    (r"no\s+experience\s+(?:required|needed)\s+high\s+pay", RiskLevel.MEDIUM),
                ],
                "description": "Employment and job scams"
            },
            
            # Urgency and Pressure Tactics
            "urgency_tactics": {
                "patterns": [
                    (r"act\s+now\s+or\s+(?:miss\s+out|lose)", RiskLevel.HIGH),
                    (r"limited\s+time\s+offer\s+expires?", RiskLevel.MEDIUM),
                    (r"urgent\s+(?:action\s+)?required", RiskLevel.MEDIUM),
                    (r"expires?\s+(?:today|tonight|in\s+\d+\s+hours?)", RiskLevel.MEDIUM),
                    (r"last\s+(?:chance|opportunity)", RiskLevel.MEDIUM),
                    (r"immediate\s+(?:action\s+)?required", RiskLevel.MEDIUM),
                    (r"don\'?t\s+(?:delay|wait|hesitate)", RiskLevel.LOW),
                ],
                "description": "Urgency and pressure tactics"
            },
            
            # Contact and Response Pressure
            "contact_pressure": {
                "patterns": [
                    (r"call\s+(?:me\s+)?(?:now|immediately|asap)", RiskLevel.MEDIUM),
                    (r"text\s+(?:me\s+)?(?:back|now|asap)", RiskLevel.MEDIUM),
                    (r"respond\s+(?:immediately|asap|now)", RiskLevel.MEDIUM),
                    (r"reply\s+(?:immediately|asap|now)", RiskLevel.MEDIUM),
                    (r"contact\s+(?:me\s+)?(?:immediately|asap)", RiskLevel.MEDIUM),
                ],
                "description": "Contact and response pressure"
            }
        }
    
    def _compile_patterns(self) -> Dict[str, List[Tuple]]:
        """Compile regex patterns for efficient matching."""
        compiled = {}
        
        for category, data in self.patterns.items():
            compiled[category] = []
            for pattern, risk_level in data["patterns"]:
                try:
                    compiled_pattern = re.compile(pattern, re.IGNORECASE | re.MULTILINE)
                    compiled[category].append((compiled_pattern, pattern, risk_level))
                except re.error as e:
                    logger.warning(f"Failed to compile pattern '{pattern}': {e}")
        
        return compiled
    
    def find_matches(self, text: str) -> List[PatternMatch]:
        """
        Find all pattern matches in text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            List of PatternMatch objects
        """
        matches = []
        
        try:
            for category, pattern_list in self.compiled_patterns.items():
                category_info = self.patterns[category]
                
                for compiled_pattern, original_pattern, risk_level in pattern_list:
                    found_matches = compiled_pattern.findall(text)
                    
                    if found_matches:
                        # Calculate confidence based on number of matches and risk level
                        match_count = len(found_matches)
                        base_confidence = {
                            RiskLevel.CRITICAL: 0.9,
                            RiskLevel.HIGH: 0.8,
                            RiskLevel.MEDIUM: 0.6,
                            RiskLevel.LOW: 0.4
                        }[risk_level]
                        
                        # Boost confidence for multiple matches
                        confidence = min(0.95, base_confidence + (match_count - 1) * 0.05)
                        
                        pattern_match = PatternMatch(
                            pattern=original_pattern,
                            matches=found_matches,
                            risk_level=risk_level,
                            confidence=confidence,
                            category=category,
                            description=category_info["description"]
                        )
                        matches.append(pattern_match)
        
        except Exception as e:
            logger.error(f"Error finding pattern matches: {e}")
        
        return matches
    
    def calculate_risk_score(self, matches: List[PatternMatch]) -> Dict[str, float]:
        """
        Calculate overall risk score from pattern matches.
        
        Args:
            matches: List of pattern matches
            
        Returns:
            Risk analysis results
        """
        if not matches:
            return {
                "risk_score": 0.1,
                "confidence": 0.5,
                "risk_level": "low",
                "explanation": "No suspicious patterns detected"
            }
        
        try:
            # Calculate weighted risk score
            total_weight = 0.0
            total_score = 0.0
            
            risk_weights = {
                RiskLevel.CRITICAL: 1.0,
                RiskLevel.HIGH: 0.8,
                RiskLevel.MEDIUM: 0.6,
                RiskLevel.LOW: 0.4
            }
            
            category_multipliers = {}
            
            for match in matches:
                weight = risk_weights[match.risk_level]
                score = match.confidence * weight
                
                # Apply category multiplier (avoid double-counting similar patterns)
                if match.category not in category_multipliers:
                    category_multipliers[match.category] = 1.0
                else:
                    category_multipliers[match.category] *= 0.8  # Diminishing returns
                
                effective_weight = weight * category_multipliers[match.category]
                total_weight += effective_weight
                total_score += score * category_multipliers[match.category]
            
            # Normalize score
            if total_weight > 0:
                risk_score = min(0.95, total_score / total_weight)
            else:
                risk_score = 0.1
            
            # Calculate overall confidence
            avg_confidence = np.mean([match.confidence for match in matches])
            match_diversity = len(set(match.category for match in matches))
            confidence = min(0.95, avg_confidence * (1 + match_diversity * 0.1))
            
            # Determine risk level
            if risk_score >= 0.8:
                risk_level = "critical"
            elif risk_score >= 0.6:
                risk_level = "high"
            elif risk_score >= 0.4:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            # Generate explanation
            top_categories = sorted(
                category_multipliers.keys(),
                key=lambda x: sum(m.confidence for m in matches if m.category == x),
                reverse=True
            )[:3]
            
            explanation = f"Detected {len(matches)} suspicious patterns across {len(category_multipliers)} categories"
            if top_categories:
                explanation += f". Primary concerns: {', '.join(top_categories)}"
            
            return {
                "risk_score": float(risk_score),
                "confidence": float(confidence),
                "risk_level": risk_level,
                "explanation": explanation,
                "match_count": len(matches),
                "categories_detected": list(category_multipliers.keys())
            }
            
        except Exception as e:
            logger.error(f"Error calculating risk score: {e}")
            return {
                "risk_score": 0.5,
                "confidence": 0.3,
                "risk_level": "unknown",
                "explanation": f"Error in analysis: {str(e)}"
            }
    
    def analyze_text(self, text: str) -> Dict[str, any]:
        """
        Perform complete pattern analysis of text.
        
        Args:
            text: Input text to analyze
            
        Returns:
            Complete analysis results
        """
        try:
            # Find all matches
            matches = self.find_matches(text)
            
            # Calculate risk score
            risk_analysis = self.calculate_risk_score(matches)
            
            # Organize matches by category
            matches_by_category = {}
            for match in matches:
                if match.category not in matches_by_category:
                    matches_by_category[match.category] = []
                matches_by_category[match.category].append({
                    "pattern": match.pattern,
                    "matches": match.matches,
                    "risk_level": match.risk_level.value,
                    "confidence": match.confidence,
                    "description": match.description
                })
            
            return {
                "risk_analysis": risk_analysis,
                "matches_by_category": matches_by_category,
                "total_matches": len(matches),
                "unique_categories": len(matches_by_category),
                "processing_successful": True
            }
            
        except Exception as e:
            logger.error(f"Error in pattern analysis: {e}")
            return {
                "risk_analysis": {
                    "risk_score": 0.0,
                    "confidence": 0.0,
                    "risk_level": "error",
                    "explanation": f"Analysis failed: {str(e)}"
                },
                "matches_by_category": {},
                "total_matches": 0,
                "unique_categories": 0,
                "processing_successful": False
            }
    
    def get_pattern_categories(self) -> List[str]:
        """Get list of all pattern categories."""
        return list(self.patterns.keys())
    
    def get_pattern_count(self) -> Dict[str, int]:
        """Get count of patterns per category."""
        return {
            category: len(data["patterns"]) 
            for category, data in self.patterns.items()
        }


# Global pattern matcher instance
pattern_matcher = ScamPatternMatcher()