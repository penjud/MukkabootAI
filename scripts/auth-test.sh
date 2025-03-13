#!/bin/bash
# MukkabootAI Authentication Test Script
# Tests the auth service by checking login, token validation, and session management

# Terminal colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
AUTH_PORT=3013
AUTH_HOST="localhost"
AUTH_URL="http://${AUTH_HOST}:${AUTH_PORT}"
DEFAULT_USERNAME="admin"
DEFAULT_PASSWORD="password"

# Test results
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Storage for tokens
ACCESS_TOKEN=""
REFRESH_TOKEN=""

echo -e "${BLUE}=== MukkabootAI Authentication Test Script ===${NC}"
echo -e "${CYAN}Testing auth service at ${AUTH_URL}${NC}"

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Warning: jq is not installed. Output will not be formatted nicely.${NC}"
    JQ_AVAILABLE=0
else
    JQ_AVAILABLE=1
fi

# Function to handle test results
test_result() {
    local test_name=$1
    local result=$2
    local message=$3
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    if [ "$result" -eq 0 ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}[PASS]${NC} $test_name"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}[FAIL]${NC} $test_name: $message"
    fi
}

# Test 1: Health check
echo -e "\n${YELLOW}Test 1: Health Check${NC}"
echo -e "${CYAN}Checking if auth service is running...${NC}"

HEALTH_RESPONSE=$(curl -s ${AUTH_URL}/health)
if [ -z "$HEALTH_RESPONSE" ]; then
    test_result "Health Check" 1 "Service is not responding"
else
    if [ $JQ_AVAILABLE -eq 1 ]; then
        echo "$HEALTH_RESPONSE" | jq
    else
        echo "$HEALTH_RESPONSE"
    fi
    test_result "Health Check" 0
fi

# Test 2: Login with default credentials
echo -e "\n${YELLOW}Test 2: Login${NC}"
echo -e "${CYAN}Attempting login with default credentials...${NC}"

LOGIN_RESPONSE=$(curl -s -X POST ${AUTH_URL}/login \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${DEFAULT_USERNAME}\",\"password\":\"${DEFAULT_PASSWORD}\"}")

if [ -z "$LOGIN_RESPONSE" ]; then
    test_result "Login" 1 "Service is not responding"
else
    if [ $JQ_AVAILABLE -eq 1 ]; then
        # Check if there's an error in the response
        ERROR=$(echo "$LOGIN_RESPONSE" | jq -r '.error // empty')
        if [ -n "$ERROR" ]; then
            test_result "Login" 1 "Error: $ERROR"
        else
            # Extract tokens from response
            ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
            REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refreshToken')
            echo "$LOGIN_RESPONSE" | jq
            
            if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
                test_result "Login" 1 "No access token returned"
            else
                test_result "Login" 0
            fi
        fi
    else
        echo "$LOGIN_RESPONSE"
        # Simple check if response contains "accessToken"
        if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
            test_result "Login" 0
        else
            test_result "Login" 1 "No access token returned"
        fi
    fi
fi

# Only proceed with token tests if we have a token
if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
    # Test 3: Validate token
    echo -e "\n${YELLOW}Test 3: Token Validation${NC}"
    echo -e "${CYAN}Validating access token...${NC}"
    
    VALIDATE_RESPONSE=$(curl -s -X POST ${AUTH_URL}/validate-token \
        -H "Content-Type: application/json" \
        -d "{\"token\":\"${ACCESS_TOKEN}\"}")
    
    if [ -z "$VALIDATE_RESPONSE" ]; then
        test_result "Token Validation" 1 "Service is not responding"
    else
        if [ $JQ_AVAILABLE -eq 1 ]; then
            TOKEN_VALID=$(echo "$VALIDATE_RESPONSE" | jq -r '.valid // false')
            echo "$VALIDATE_RESPONSE" | jq
            
            if [ "$TOKEN_VALID" = "true" ]; then
                test_result "Token Validation" 0
            else
                ERROR=$(echo "$VALIDATE_RESPONSE" | jq -r '.error // "Unknown error"')
                test_result "Token Validation" 1 "Error: $ERROR"
            fi
        else
            echo "$VALIDATE_RESPONSE"
            if echo "$VALIDATE_RESPONSE" | grep -q "\"valid\":true"; then
                test_result "Token Validation" 0
            else
                test_result "Token Validation" 1 "Token is not valid"
            fi
        fi
    fi
    
    # Test 4: Access protected resource
    echo -e "\n${YELLOW}Test 4: Protected Resource Access${NC}"
    echo -e "${CYAN}Accessing a protected resource...${NC}"
    
    PROTECTED_RESPONSE=$(curl -s ${AUTH_URL}/users/me \
        -H "Authorization: Bearer ${ACCESS_TOKEN}")
    
    if [ -z "$PROTECTED_RESPONSE" ]; then
        test_result "Protected Resource Access" 1 "Service is not responding"
    else
        if [ $JQ_AVAILABLE -eq 1 ]; then
            ERROR=$(echo "$PROTECTED_RESPONSE" | jq -r '.error // empty')
            if [ -n "$ERROR" ]; then
                test_result "Protected Resource Access" 1 "Error: $ERROR"
            else
                echo "$PROTECTED_RESPONSE" | jq
                test_result "Protected Resource Access" 0
            fi
        else
            echo "$PROTECTED_RESPONSE"
            if echo "$PROTECTED_RESPONSE" | grep -q "\"username\":"; then
                test_result "Protected Resource Access" 0
            else
                test_result "Protected Resource Access" 1 "Could not access protected resource"
            fi
        fi
    fi
    
    # Test 5: Refresh token
    if [ -n "$REFRESH_TOKEN" ] && [ "$REFRESH_TOKEN" != "null" ]; then
        echo -e "\n${YELLOW}Test 5: Token Refresh${NC}"
        echo -e "${CYAN}Refreshing access token...${NC}"
        
        REFRESH_RESPONSE=$(curl -s -X POST ${AUTH_URL}/refresh-token \
            -H "Content-Type: application/json" \
            -d "{\"token\":\"${REFRESH_TOKEN}\"}")
        
        if [ -z "$REFRESH_RESPONSE" ]; then
            test_result "Token Refresh" 1 "Service is not responding"
        else
            if [ $JQ_AVAILABLE -eq 1 ]; then
                # Check if there's an error in the response
                ERROR=$(echo "$REFRESH_RESPONSE" | jq -r '.error // empty')
                if [ -n "$ERROR" ]; then
                    test_result "Token Refresh" 1 "Error: $ERROR"
                else
                    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')
                    echo "$REFRESH_RESPONSE" | jq
                    
                    if [ "$NEW_ACCESS_TOKEN" = "null" ] || [ -z "$NEW_ACCESS_TOKEN" ]; then
                        test_result "Token Refresh" 1 "No new access token returned"
                    else
                        test_result "Token Refresh" 0
                    fi
                fi
            else
                echo "$REFRESH_RESPONSE"
                if echo "$REFRESH_RESPONSE" | grep -q "accessToken"; then
                    test_result "Token Refresh" 0
                else
                    test_result "Token Refresh" 1 "No new access token returned"
                fi
            fi
        fi
    else
        echo -e "\n${YELLOW}Test 5: Token Refresh - SKIPPED (No refresh token available)${NC}"
    fi
else
    echo -e "\n${YELLOW}Tests 3-5: SKIPPED (No access token available from login)${NC}"
fi

# Display summary
echo -e "\n${MAGENTA}=== Test Summary ===${NC}"
echo -e "${CYAN}Total Tests: ${TESTS_TOTAL}${NC}"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"

# Return success only if all tests passed
if [ ${TESTS_FAILED} -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed successfully!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed. Please check the output for details.${NC}"
    exit 1
fi
