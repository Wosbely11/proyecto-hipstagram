pipeline {
    agent any // Se ejecuta en cualquier nodo disponible de Jenkins

    environment {
        // Jenkins extrae las llaves de su bóveda y las guarda en estas variables
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

        stage('2. Análisis de Calidad (SonarQube)') {
            environment {
                // Requiere que el plugin de SonarQube esté instalado en Jenkins
                scannerHome = tool 'SonarQubeScanner'
            }
            steps {
                echo 'Ejecutando escaneo de vulnerabilidades y bugs...'
                withSonarQubeEnv('SonarQube-Server') {
                    sh "${scannerHome}/bin/sonar-scanner"
                }
            }
        }

        stage('3. Despliegue Simulado') {
            steps {
                echo 'El código es seguro. Listo para ejecutar docker-compose...'
                // sh "docker-compose up -d --build" ---------- Comentado para no afectar el servidor
            }
        }
    }
}

//empiezo otra prueba 
pipeline {
    agent any

    tools {
        // Le decimos a Jenkins que use Node para poder correr tu backend
        nodejs 'Node20' 
    }

    environment {
        DOCKER_USER = 'nkendal' 
        APP_NAME = 'hipstagram-backend'
    }

    stages {
        stage('1. Obtener Código') {
            steps {
                echo 'Descargando la última versión del repositorio...'
                checkout scm
            }
        }

        stage('2. Instalar Dependencias (Backend)') {
            steps {
                // dir() hace que Jenkins "entre" a la carpeta backend antes de ejecutar comandos
                dir('backend') {
                    sh 'npm install'
                    sh 'npx prisma generate'
                }
            }
        }

        stage('3. Análisis y Pruebas (Lint & Test)') {
            steps {
                dir('backend') {
                    sh 'npm run lint'
                    sh 'npm run test:cov' // Esto genera el reporte de cobertura que pide el PDF
                }
            }
        }

        stage('4. Escaneo SonarQube') {
            steps {
                // Ejecutamos el escáner en la raíz para que lea el sonar-project.properties
                withSonarQubeEnv('sonar-server') {
                    sh 'npx sonarqube-scanner'
                }
            }
        }

        stage('5. Quality Gate (El Juez)') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    // Esto cumple el requisito del PDF: Bloquea si SonarQube encuentra errores
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('6. Build & Push Docker') {
            steps {
                script {
                    echo "Construyendo contenedor para ${DOCKER_USER}/${APP_NAME}:latest"
                    
                    // Asegúrate de tener credenciales de docker hub configuradas en Jenkins como antes
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', passwordVariable: 'DOCKER_PASSWORD', usernameVariable: 'DOCKER_USERNAME')]) {
                        sh "docker login -u ${DOCKER_USERNAME} -p ${DOCKER_PASSWORD}"
                        
                        // Construye la imagen apuntando al Dockerfile dentro de la carpeta backend
                        sh "docker build -t ${DOCKER_USER}/${APP_NAME}:latest ./backend"
                        sh "docker push ${DOCKER_USER}/${APP_NAME}:latest"
                    }
                }
            }
        }
    }
}