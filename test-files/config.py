#!/usr/bin/env python3
"""
Python configuration module demonstrating syntax highlighting
"""

import os
import json
import logging
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@dataclass
class DatabaseConfig:
    """Database configuration settings"""
    host: str = "localhost"
    port: int = 5432
    database: str = "myapp"
    username: str = "user"
    password: str = "password"
    ssl_mode: str = "require"
    
    def to_dict(self) -> Dict[str, Union[str, int]]:
        """Convert to dictionary"""
        return {
            'host': self.host,
            'port': self.port,
            'database': self.database,
            'username': self.username,
            'password': self.password,
            'ssl_mode': self.ssl_mode
        }

class ConfigManager:
    """Manage application configuration"""
    
    def __init__(self, config_path: Optional[str] = None):
        self.config_path = Path(config_path or "config.json")
        self.config = {}
        self._load_config()
    
    def _load_config(self) -> None:
        """Load configuration from file"""
        try:
            if self.config_path.exists():
                with open(self.config_path, 'r') as f:
                    self.config = json.load(f)
                logger.info(f"Loaded config from {self.config_path}")
            else:
                logger.warning("Config file not found, using defaults")
                self._create_default_config()
        except (json.JSONDecodeError, IOError) as e:
            logger.error(f"Failed to load config: {e}")
            raise
    
    def _create_default_config(self) -> None:
        """Create default configuration"""
        self.config = {
            'database': DatabaseConfig().to_dict(),
            'api': {
                'host': '0.0.0.0',
                'port': 8000,
                'debug': False,
                'allowed_origins': ['http://localhost:3000']
            },
            'cache': {
                'type': 'redis',
                'host': 'localhost',
                'port': 6379,
                'db': 0,
                'ttl': 3600
            },
            'features': {
                'enable_auth': True,
                'enable_logging': True,
                'enable_metrics': False,
                'max_file_size': 10 * 1024 * 1024  # 10MB
            }
        }
        
        # Save default config
        self.save_config()
    
    def get(self, key: str, default=None):
        """Get configuration value with dot notation"""
        keys = key.split('.')
        value = self.config
        
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        
        return value
    
    def set(self, key: str, value) -> None:
        """Set configuration value with dot notation"""
        keys = key.split('.')
        config = self.config
        
        # Navigate to parent
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        # Set the value
        config[keys[-1]] = value
        logger.info(f"Updated config: {key} = {value}")
    
    def save_config(self) -> None:
        """Save configuration to file"""
        try:
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Saved config to {self.config_path}")
        except IOError as e:
            logger.error(f"Failed to save config: {e}")
            raise
    
    def validate_config(self) -> List[str]:
        """Validate configuration and return list of errors"""
        errors = []
        
        # Validate database config
        db_config = self.get('database', {})
        required_db_fields = ['host', 'port', 'database', 'username']
        
        for field in required_db_fields:
            if field not in db_config:
                errors.append(f"Missing required database field: {field}")
        
        # Validate API config
        api_port = self.get('api.port')
        if not isinstance(api_port, int) or api_port < 1 or api_port > 65535:
            errors.append("Invalid API port number")
        
        # Validate features
        max_file_size = self.get('features.max_file_size')
        if max_file_size and max_file_size < 1024:
            errors.append("Max file size too small (minimum 1KB)")
        
        return errors

# Global config instance
config = ConfigManager()

# Example usage and testing
if __name__ == "__main__":
    print("Configuration Manager Test")
    print("=" * 30)
    
    # Test configuration access
    db_host = config.get('database.host', 'localhost')
    api_port = config.get('api.port', 8000)
    debug_mode = config.get('api.debug', False)
    
    print(f"Database Host: {db_host}")
    print(f"API Port: {api_port}")
    print(f"Debug Mode: {debug_mode}")
    
    # Test validation
    errors = config.validate_config()
    if errors:
        print("\nConfiguration Errors:")
        for error in errors:
            print(f"  - {error}")
    else:
        print("\n✓ Configuration is valid")
    
    # Test setting values
    config.set('api.debug', True)
    config.set('features.new_feature', 'enabled')
    
    print(f"\nUpdated debug mode: {config.get('api.debug')}")
    print(f"New feature: {config.get('features.new_feature')}")