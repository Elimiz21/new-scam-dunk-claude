#!/bin/bash

# Test all pages for design consistency
echo "🧪 Testing ALL pages for consistent design system..."
echo "=============================================="

BASE_URL="http://localhost:3000"

# Array of all pages to test
PAGES=(
    "/"
    "/register" 
    "/login"
    "/dashboard"
    "/dashboard/scan"
    "/dashboard/alerts" 
    "/dashboard/history"
    "/dashboard/chat-import"
)

# Function to test a page
test_page() {
    local page=$1
    local url="${BASE_URL}${page}"
    
    echo ""
    echo "🔍 Testing: $url"
    echo "--------------------------------------------"
    
    # Test if page loads (200 status)
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$status" == "200" ]; then
        echo "✅ Status: $status (OK)"
        
        # Download page content
        content=$(curl -s "$url")
        
        # Check if page contains our global CSS variables
        if echo "$content" | grep -q ":root" && echo "$content" | grep -q "var(--"; then
            echo "✅ Global CSS: Detected CSS variables"
        else
            echo "❌ Global CSS: Missing CSS variables"
        fi
        
        # Check if page has proper background
        if echo "$content" | grep -q "bg-page" || echo "$content" | grep -q "#f8fafc"; then
            echo "✅ Background: Proper page background detected"
        else
            echo "⚠️  Background: Check background styling"
        fi
        
        # Check for Inter font
        if echo "$content" | grep -q "Inter"; then
            echo "✅ Typography: Inter font detected"
        else
            echo "⚠️  Typography: Check font family"
        fi
        
        # Check for consistent button styling
        if echo "$content" | grep -q "button\|Button"; then
            echo "✅ Components: Button elements detected"
        else
            echo "ℹ️  Components: No buttons on this page"
        fi
        
    else
        echo "❌ Status: $status (Failed to load)"
    fi
}

# Test all pages
for page in "${PAGES[@]}"; do
    test_page "$page"
done

echo ""
echo "=============================================="
echo "🎯 Design System Test Complete!"
echo "=============================================="
echo ""
echo "📋 Next Steps:"
echo "1. Visit http://localhost:3000 in your browser"
echo "2. Navigate through all pages manually"
echo "3. Verify consistent design across all pages"
echo "4. Check that buttons, cards, and forms look identical"
echo ""