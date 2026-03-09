#!/bin/bash

# Hospital Management System - Chatbot Verification Script

echo "🔍 Verifying Chatbot Fixes..."
echo ""

# Check if files exist
echo "✅ Checking files..."
if [ -f "frontend/.env.local" ]; then
  echo "  ✓ .env.local exists"
else
  echo "  ✗ .env.local missing - Create it!"
fi

if [ -f "frontend/src/components/AIAssistant.jsx" ]; then
  echo "  ✓ AIAssistant.jsx exists"
else
  echo "  ✗ AIAssistant.jsx missing"
fi

echo ""
echo "📋 Checking configuration..."

# Check if VITE_GROQ_API_KEY is in .env.local
if grep -q "VITE_GROQ_API_KEY" frontend/.env.local 2>/dev/null; then
  echo "  ✓ VITE_GROQ_API_KEY configured"
else
  echo "  ✗ VITE_GROQ_API_KEY not found - Add to .env.local"
fi

# Check if VITE_BACKEND_URL is in .env.local
if grep -q "VITE_BACKEND_URL" frontend/.env.local 2>/dev/null; then
  echo "  ✓ VITE_BACKEND_URL configured"
else
  echo "  ✗ VITE_BACKEND_URL not found - Add to .env.local"
fi

echo ""
echo "🔧 Checking code fixes..."

# Check if API key is properly configured
if grep -q 'import.meta.env.VITE_GROQ_API_KEY' frontend/src/components/AIAssistant.jsx; then
  echo "  ✓ API key uses environment variable"
else
  echo "  ✗ API key issue"
fi

# Check if error handling exists
if grep -q 'try.*catch' frontend/src/components/AIAssistant.jsx; then
  echo "  ✓ Error handling implemented"
else
  echo "  ✗ Error handling missing"
fi

# Check if appointment flow is updated
if grep -q 'handleAppointmentFlow' frontend/src/components/AIAssistant.jsx; then
  echo "  ✓ Appointment flow exists"
else
  echo "  ✗ Appointment flow missing"
fi

echo ""
echo "📦 Installation steps:"
echo "  1. cd frontend"
echo "  2. npm install"
echo "  3. npm run dev"
echo ""
echo "🚀 Backend setup:"
echo "  1. cd backend"
echo "  2. npm install"
echo "  3. npm start"
echo ""
echo "✅ All checks complete!"
