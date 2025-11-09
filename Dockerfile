# Stage 1: Build frontend
FROM node:18 AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build backend
FROM maven:3.9.4-eclipse-temurin-17 AS backend-builder
WORKDIR /app
COPY backend /app/backend
COPY --from=frontend-builder /app/frontend/build /app/backend/src/main/resources/static
RUN mvn -f /app/backend/pom.xml clean package -DskipTests

# Stage 3: Run
FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=backend-builder /app/backend/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
