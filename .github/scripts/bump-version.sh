#!/bin/bash

# Semantic Version Bumping Script
# This script automatically bumps version numbers based on commit messages
# Supports: major, minor, patch versions following semantic versioning
#
# Usage: ./bump-version.sh <version-file> [--major|--minor|--patch]
# Environment variables:
#   - COMMIT_MESSAGE: Git commit message to parse for version bump
#   - VERSION_TYPE: Override with major|minor|patch

set -e

VERSION_FILE="${1:-.}"
OVERRIDE_TYPE="${2:-}"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_error() {
  echo -e "${RED}❌ ERROR: $1${NC}" >&2
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Parse semantic version
parse_version() {
  local version="$1"
  
  # Remove 'v' prefix if present
  version="${version#v}"
  
  # Extract major, minor, patch
  if [[ $version =~ ^([0-9]+)\.([0-9]+)\.([0-9]+)(.*)$ ]]; then
    MAJOR="${BASH_REMATCH[1]}"
    MINOR="${BASH_REMATCH[2]}"
    PATCH="${BASH_REMATCH[3]}"
    PRERELEASE="${BASH_REMATCH[4]}"
    return 0
  else
    log_error "Invalid semantic version format: $version"
    return 1
  fi
}

# Bump version based on type
bump_version() {
  local bump_type="$1"
  
  case "$bump_type" in
    major)
      MAJOR=$((MAJOR + 1))
      MINOR=0
      PATCH=0
      PRERELEASE=""
      ;;
    minor)
      MINOR=$((MINOR + 1))
      PATCH=0
      PRERELEASE=""
      ;;
    patch)
      PATCH=$((PATCH + 1))
      PRERELEASE=""
      ;;
    *)
      log_error "Invalid bump type: $bump_type"
      return 1
      ;;
  esac
}

# Determine version bump from commit message
detect_version_bump() {
  local commit_message="${COMMIT_MESSAGE:-}"
  
  # Check for explicit keywords in commit message
  if [[ "$commit_message" =~ breaking|BREAKING\ CHANGE ]]; then
    echo "major"
  elif [[ "$commit_message" =~ ^feat(\(.+\))?!: ]]; then
    # Conventional commits: feat! = breaking change
    echo "major"
  elif [[ "$commit_message" =~ ^feat ]]; then
    # Conventional commits: feat = minor version bump
    echo "minor"
  elif [[ "$commit_message" =~ ^fix ]]; then
    # Conventional commits: fix = patch version bump
    echo "patch"
  else
    # Default to patch for other commits
    echo "patch"
  fi
}

# Main logic
main() {
  log_info "🔄 Starting version bump process..."
  
  # Handle Chart.yaml specifically
  if [[ "$VERSION_FILE" == *"Chart.yaml" ]]; then
    if [ ! -f "$VERSION_FILE" ]; then
      log_error "Chart.yaml not found at $VERSION_FILE"
      exit 1
    fi
    
    log_info "Processing Helm Chart: $VERSION_FILE"
    
    # Extract current chart version
    CURRENT_VERSION=$(yq '.version' "$VERSION_FILE" 2>/dev/null || echo "0.0.0")
    CURRENT_APP_VERSION=$(yq '.appVersion' "$VERSION_FILE" 2>/dev/null || echo "0.0.0")
    
    log_info "Current Chart Version: $CURRENT_VERSION"
    log_info "Current App Version: $CURRENT_APP_VERSION"
    
    # Determine version bump type
    if [ -n "$OVERRIDE_TYPE" ]; then
      BUMP_TYPE="$OVERRIDE_TYPE"
      log_info "Using override bump type: $BUMP_TYPE"
    else
      BUMP_TYPE=$(detect_version_bump)
      log_info "Detected bump type from commit: $BUMP_TYPE"
    fi
    
    # Parse and bump chart version
    parse_version "$CURRENT_VERSION"
    bump_version "$BUMP_TYPE"
    NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
    
    # Parse and bump app version (same as chart version)
    parse_version "$CURRENT_APP_VERSION"
    bump_version "$BUMP_TYPE"
    NEW_APP_VERSION="${MAJOR}.${MINOR}.${PATCH}"
    
    log_info "New Chart Version: $NEW_VERSION"
    log_info "New App Version: $NEW_APP_VERSION"
    
    # Update Chart.yaml
    yq eval ".version = \"$NEW_VERSION\"" -i "$VERSION_FILE"
    yq eval ".appVersion = \"v$NEW_APP_VERSION\"" -i "$VERSION_FILE"
    
    log_success "Updated Chart.yaml with version $NEW_VERSION"
    
    # Output for GitHub Actions
    echo "chart_version=$NEW_VERSION" >> $GITHUB_OUTPUT 2>/dev/null || true
    echo "app_version=$NEW_APP_VERSION" >> $GITHUB_OUTPUT 2>/dev/null || true
    echo "bump_type=$BUMP_TYPE" >> $GITHUB_OUTPUT 2>/dev/null || true
    
    # Display result
    echo ""
    log_success "Version bump completed successfully!"
    echo ""
    echo "  Chart Version: $CURRENT_VERSION → $NEW_VERSION"
    echo "  App Version: $CURRENT_APP_VERSION → v$NEW_APP_VERSION"
    echo "  Bump Type: $BUMP_TYPE"
    
  else
    log_error "Unsupported file type. Only Chart.yaml is currently supported."
    exit 1
  fi
}

# Run main
main
