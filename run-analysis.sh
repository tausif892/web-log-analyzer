
#!/bin/bash

set -e

# Move to the project directory
cd "$(dirname "$0")"

# Java 8 configuration
export JAVA_HOME="$HOME/.local/opt/jdk8u504-b01"
export PATH="$JAVA_HOME/bin:$HOME/.local/opt/pig-0.18.0/bin:$PATH"

# Pig dependencies
export PIG_CLASSPATH="/usr/share/java/commons-lang3.jar:/usr/share/java/commons-compress.jar:/usr/share/java/woodstox-core.jar:/usr/share/java/stax2-api.jar:/usr/share/java/httpclient.jar:/usr/share/java/httpcore.jar:/usr/share/java/commons-logging.jar:/usr/share/java/commons-codec.jar"

# Google Cloud Storage bucket
BUCKET="gs://web-logs-bucket-cloud-computing"

echo "================================"
echo "       LOGWATCH ANALYZER"
echo "================================"

mkdir -p data output

# Step 1: Download logs
echo "[1/3] Downloading access logs..."

gcloud storage cp \
    "$BUCKET/input/access_logs.csv" \
    data/access_logs.csv

# Step 2: Execute Pig
echo "[2/3] Running Apache Pig locally..."

pig -x local scripts/log-analyzer.pig

# Step 3: Upload reports
echo "[3/3] Uploading analytics reports..."

gcloud storage cp \
    output/high_volume/part-r-00000 \
    "$BUCKET/output/high_volume.csv"

gcloud storage cp \
    output/repeated_failures/part-r-00000 \
    "$BUCKET/output/repeated_failures.csv"

gcloud storage cp \
    output/server_errors/part-r-00000 \
    "$BUCKET/output/server_errors.csv"

echo "================================"
echo " LOGWATCH analysis completed!"
echo "================================"

