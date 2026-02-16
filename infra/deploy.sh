#!/bin/bash
set -e

# Change directory to the root of the project
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR/.."

echo "Building Lambda function..."

# Ensure dependencies are installed for the build
# We use esbuild to bundle the TypeScript Lambda function into a single JS file.
# If esbuild is not in node_modules, we can try to use npx.

mkdir -p infra/dist

npx esbuild infra/cleanup-lambda.ts \
  --bundle \
  --minify \
  --platform=node \
  --target=node20 \
  --outfile=infra/dist/index.js

echo "Deploying via CloudFormation..."

# You can override parameters if needed
TABLE_NAME=${DYNAMODB_TABLE:-VisitingHoursPage}
BUCKET_NAME=${S3_BUCKET:-visiting-hours}
STACK_NAME="visiting-hours-cleanup"

# Deployment command
DEPLOY_BUCKET=${AWS_DEPLOY_BUCKET:-"visiting-hours-deploy-artifacts"}
REGION=${AWS_REGION:-"eu-west-1"}

echo "Using S3 bucket for artifacts: $DEPLOY_BUCKET"

# Check if bucket exists, create it if not
if ! aws s3api head-bucket --bucket "$DEPLOY_BUCKET" 2>/dev/null; then
  echo "Bucket $DEPLOY_BUCKET does not exist. Creating..."
  if [ "$REGION" == "us-east-1" ]; then
    aws s3api create-bucket --bucket "$DEPLOY_BUCKET" --region "$REGION"
  else
    aws s3api create-bucket --bucket "$DEPLOY_BUCKET" --region "$REGION" --create-bucket-configuration LocationConstraint="$REGION"
  fi
else
  echo "Bucket $DEPLOY_BUCKET already exists."
fi

echo "Packaging and uploading to S3 ($DEPLOY_BUCKET)..."
aws cloudformation package \
  --template-file infra/template.yaml \
  --s3-bucket "$DEPLOY_BUCKET" \
  --output-template-file infra/packaged.yaml

echo "Deploying CloudFormation stack..."
aws cloudformation deploy \
  --template-file infra/packaged.yaml \
  --stack-name "$STACK_NAME" \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides TableName="$TABLE_NAME" BucketName="$BUCKET_NAME"

echo "Deployment complete."
