#!/usr/bin/env bash

build_source_nda_esign_env_args() {
  local provider="${SOURCE_NDA_ESIGN_PROVIDER:-disabled}"
  local name
  source_nda_esign_env_args=("SOURCE_NDA_ESIGN_PROVIDER=$provider")

  if [[ "$provider" == "disabled" ]]; then
    return 0
  fi
  if [[ "$provider" != "docusign" || "${SOURCE_NDA_ESIGN_ENVIRONMENT:-}" != "demo" ]]; then
    echo "Source NDA e-signature permits only disabled or the demo DocuSign provider." >&2
    return 1
  fi

  for name in SOURCE_NDA_ESIGN_INTEGRATION_KEY SOURCE_NDA_ESIGN_ACCOUNT_ID \
    SOURCE_NDA_ESIGN_USER_ID SOURCE_NDA_ESIGN_KEY_ID SOURCE_NDA_ESIGN_TEST_INBOX; do
    if [[ -z "${!name:-}" ]]; then
      echo "Missing Source NDA deploy configuration: $name" >&2
      return 1
    fi
  done
  if [[ ! "$SOURCE_NDA_ESIGN_KEY_ID" =~ ^https://kv-abarva-lab-001\.vault\.azure\.net/keys/source-nda-docusign-lab-jwt/[[:xdigit:]]{32}$ ]]; then
    echo "Source NDA signing key must be a versioned lab-vault key URL." >&2
    return 1
  fi
  if [[ ! "$SOURCE_NDA_ESIGN_TEST_INBOX" =~ ^[^@[:space:]]+@abarva\.ai$ ]]; then
    echo "Source NDA demo test inbox must be an internal address." >&2
    return 1
  fi

  source_nda_esign_env_args+=(
    "SOURCE_NDA_ESIGN_ENVIRONMENT=$SOURCE_NDA_ESIGN_ENVIRONMENT"
    "SOURCE_NDA_ESIGN_INTEGRATION_KEY=$SOURCE_NDA_ESIGN_INTEGRATION_KEY"
    "SOURCE_NDA_ESIGN_ACCOUNT_ID=$SOURCE_NDA_ESIGN_ACCOUNT_ID"
    "SOURCE_NDA_ESIGN_USER_ID=$SOURCE_NDA_ESIGN_USER_ID"
    "SOURCE_NDA_ESIGN_KEY_ID=$SOURCE_NDA_ESIGN_KEY_ID"
    "SOURCE_NDA_ESIGN_TEST_INBOX=$SOURCE_NDA_ESIGN_TEST_INBOX"
  )
}
