# Shared World Relay for EaglercraftX 1.8.8.
# The relay only brokers WebRTC connections between browsers; it is not a game
# server and holds no world data.
#
# Put SharedWorldRelay.jar next to this Dockerfile before building. The jar is
# downloaded from the client itself: Multiplayer -> Network Settings -> "Download
# relay server". Bundling a copy here would rot the moment the client updates.
FROM eclipse-temurin:17-jre-alpine

WORKDIR /relay
COPY SharedWorldRelay.jar /relay/SharedWorldRelay.jar
COPY relay.yml /relay/relay.yml

EXPOSE 8081
CMD ["java", "-Xmx128M", "-jar", "SharedWorldRelay.jar", "--config", "relay.yml"]
