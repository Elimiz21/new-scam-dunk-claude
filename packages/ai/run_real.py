#!/usr/bin/env python3
"""
Run the real AI service with proper error handling
"""

import sys
import os

# Try to run the real main.py
try:
    # Import and run the real service
    from main import app
    import uvicorn
    
    port = int(os.getenv("AI_SERVICE_PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)
    
except ImportError as e:
    print(f"Import error: {e}")
    print("Running simplified server instead...")
    
    # Run the simple server as fallback
    import subprocess
    subprocess.run([sys.executable, "simple_server.py"])
    
except Exception as e:
    print(f"Error starting AI service: {e}")
    print("Running simplified server...")
    
    # Run the simple server as fallback
    import subprocess
    subprocess.run([sys.executable, "simple_server.py"])