
FROM eclipse-temurin:8-jre-jammy

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libwoodstox-java \
    libstax2-api-java \
    libhttpclient-java \
    libcommons-lang3-java \
    && rm -rf /var/lib/apt/lists/*

ENV PIG_VERSION=0.18.0
ENV PIG_HOME=/opt/pig
ENV PATH="${PIG_HOME}/bin:${PATH}"

RUN curl -fL \
    "https://archive.apache.org/dist/pig/pig-${PIG_VERSION}/pig-${PIG_VERSION}.tar.gz" \
    -o /tmp/pig.tar.gz \
    && mkdir -p /opt \
    && tar -xzf /tmp/pig.tar.gz -C /opt \
    && mv "/opt/pig-${PIG_VERSION}" "${PIG_HOME}" \
    && rm /tmp/pig.tar.gz

ENV PIG_CLASSPATH="/usr/share/java/commons-lang3.jar:/usr/share/java/woodstox-core.jar:/usr/share/java/stax2-api.jar:/usr/share/java/httpclient.jar:/usr/share/java/httpcore.jar:/usr/share/java/commons-logging.jar:/usr/share/java/commons-codec.jar"

WORKDIR /workspace

CMD ["pig", "-version"]

