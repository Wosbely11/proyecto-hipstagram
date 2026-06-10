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

        stage('Deploy to AWS EC2') {
            steps {
                script {
                    // Jenkins usa tu archivo .pem para entrar al servidor EC2
                    // Clona el código de la rama DW-Dev desde GitHub
                    // Y ejecuta docker-compose para levantar la versión de producción
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i /ruta/a/tu/aws-hipstagram-key.pem ubuntu@IP_DE_TU_EC2 "
                            rm -rf proyecto-hipstagram &&
                            git clone -b DW-Dev https://github.com/Wosbely11/proyecto-hipstagram.git &&
                            cd proyecto-hipstagram &&
                            docker-compose -f docker-compose.prod.yml up -d --build
                        "
                    '''
                }
            }
        }
    }
}