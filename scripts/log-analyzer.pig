
-- ==========================================
-- WEB LOG ANALYTICS AND SUSPICIOUS TRAFFIC
-- Apache Pig 0.18.0 - Local Mode
-- ==========================================

-- 1. LOAD WEB SERVER LOGS

logs = LOAD 'data/access_logs.csv'
    USING PigStorage(',')
    AS (
        ip:chararray,
        timestamp:chararray,
        method:chararray,
        path:chararray,
        status:int
    );

-- 2. DATA CLEANING

valid_logs = FILTER logs BY
    ip IS NOT NULL AND
    timestamp IS NOT NULL AND
    status IS NOT NULL;

-- ==========================================
-- ANALYSIS 1: HIGH REQUEST VOLUME
-- ==========================================

ip_groups = GROUP valid_logs BY ip;

request_counts = FOREACH ip_groups GENERATE
    group AS ip,
    COUNT(valid_logs) AS total_requests;

high_volume = FILTER request_counts BY
    total_requests >= 5;

ranked_ips = ORDER high_volume BY
    total_requests DESC;

STORE ranked_ips INTO
    'output/high_volume'
    USING PigStorage(',');

-- ==========================================
-- ANALYSIS 2: REPEATED AUTHENTICATION FAILURES
-- ==========================================

failures = FILTER valid_logs BY
    status == 401 OR status == 403;

failure_groups = GROUP failures BY ip;

failure_counts = FOREACH failure_groups GENERATE
    group AS ip,
    COUNT(failures) AS failed_requests;

repeat_failures = FILTER failure_counts BY
    failed_requests >= 3;

ranked_failures = ORDER repeat_failures BY
    failed_requests DESC;

STORE ranked_failures INTO
    'output/repeated_failures'
    USING PigStorage(',');

-- ==========================================
-- ANALYSIS 3: SERVER ERROR HOTSPOTS
-- ==========================================

server_errors = FILTER valid_logs BY
    status >= 500 AND status < 600;

endpoint_groups = GROUP server_errors BY path;

endpoint_counts = FOREACH endpoint_groups GENERATE
    group AS endpoint,
    COUNT(server_errors) AS error_count;

ranked_errors = ORDER endpoint_counts BY
    error_count DESC;

STORE ranked_errors INTO
    'output/server_errors'
    USING PigStorage(',');

-- ==========================================
-- END OF ANALYSIS
-- ==========================================
