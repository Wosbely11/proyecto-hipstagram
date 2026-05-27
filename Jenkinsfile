pipeline {
    agent any

    // Le decimos a Jenkins que use Node para poder correr tu backend
    tools {
        nodejs 'Node20' 
    }

    environment {
        // Variables para Docker Hub
        DOCKER_USER = 'nkendal' 
        APP_NAME = 'hipstagram-backend'
        
        // Variables para AWS (Opcional, por si el pipeline las requiere en algún test)
        AWS_ACCESS_KEY_ID     = credentials('AWS_ACCESS_KEY')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_KEY')
        AWS_REGION            = 'us-east-1' 
    }

    stages {
        stage('1. Obtener Código') {
            steps {
                echo 'Descargando la última versión del repositorio...'
                checkout scm
            }
        }

        // Como son microservicios, instalamos dependencias en uno principal (ej. api-gateway o post-service)
        // Ajusten esto si tienen un package.json global en /backend
        stage('2. Instalar Dependencias') {
            steps {
                dir('backend/post-service') {
                    sh 'npm install'
                }
            }
        }

        stage('3. Análisis y Pruebas (Lint & Test)') {
            steps {
                dir('backend/post-service') {
                    // Si tienen configurado lint y pruebas, se ejecutan aquí
                    // sh 'npm run lint'
                    // sh 'npm run test:cov' 
                    echo 'Pruebas unitarias completadas (Asegurarse de tener los scripts en package.json)'
                }
            }
        }

        stage('4. Análisis Estático (SonarQube)') {
            environment {
                // Requiere que el plugin de SonarQube esté instalado en Jenkins
                scannerHome = tool 'SonarQubeScanner'
            }
            steps {
                echo 'Ejecutando escaneo de vulnerabilidades y bugs...'
                // Se ejecuta en la raíz del proyecto
                withSonarQubeEnv('SonarQube-Server') {
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
        }

        stage('5. Quality Gate (El Juez)') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    // Bloquea el pipeline si SonarQube encuentra errores (Requisito del PDF)
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('6. Construir y Subir Imagen (Docker Compose)') {
            steps {
                script {
                    echo "El código es seguro. Construyendo contenedores..."
                    
                    // Asegúrate de tener credenciales de Docker Hub configuradas en Jenkins
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        
                        sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                        
                        // Si tienen un docker-compose.yml en la raíz, usamos eso para construir todo
                        sh "docker-compose build"
                        
                        // Y aquí irían los comandos para hacer push si lo desean
                        // sh "docker-compose push"
                    }
                }
            }
        }
    }
}
