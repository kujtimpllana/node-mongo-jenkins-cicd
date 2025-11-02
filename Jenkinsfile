pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "kujtimpllana"
        APP_NAME = "node-app"
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
    }

    stages {
        stage('Checkout') {
            // steps {
            //     checkout scm
            // }
            steps {
                echo "Checking out into GitHub Repo..."
                git branch: "main",
                    url: "https://github.com/kujtimpllana/node-mongo-jenkins-cicd.git",
                    credentialsId: "github-creds"
            }  
        }
        stage('Build Docker Image') {
            when {
                anyOf {
                    changeset "api/**"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo "Building docker image..."
                script {
                    COMMIT_ID = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                }
                //force to install fresh package.json & package-lock json files to ensure the version without CVE vulnerability is being ran on the image
                sh """
                    docker build --no-cache -t ${DOCKERHUB_USER}/${APP_NAME}:${COMMIT_ID} ./api
                """
            }
        }
        stage('Image Testing with Trivy') {
            when {
                anyOf {
                    changeset "api/**"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo "Testing the image before pushing for any potential security issues using Trivy..."
                
                script {
                    sh "mkdir -p ${WORKSPACE}/trivy-results"
                    try {
                        sh """
                        docker pull aquasec/trivy:latest
                        docker run --rm \
                            -v /var/run/docker.sock:/var/run/docker.sock \
                            -v ${WORKSPACE}/trivy-results:/app \
                            -w /app \
                            aquasec/trivy:latest image \
                            --exit-code 1 \
                            --severity HIGH,CRITICAL \
                            --format json \
                            --output trivy-report.json \
                            ${DOCKERHUB_USER}/${APP_NAME}:${COMMIT_ID}
                        """
                    } finally {
                        archiveArtifacts artifacts: 'trivy-results/trivy-report.json', allowEmptyArchive: true
                    }
                }              
            }
        }
        stage('Unit testing with Mocha') {
            when {
                anyOf {
                    changeset "api/**"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                sh """
                    cd api
                    rm -rf test-results
                    mkdir -p test-results

                    docker run --rm \
                      -v \$PWD/test-results:/usr/src/app/test-results \
                      -w /usr/src/app \
                      ${DOCKERHUB_USER}/${APP_NAME}:${COMMIT_ID} \
                      npm test
                """
                junit 'api/test-results/results.xml'
            }
        }
        stage('Push to Docker Hub') {
            when {
                anyOf {
                    changeset "api/**"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: "dockerhub_creds", usernameVariable: "DOCKER_USER", passwordVariable: "DOCKER_PASS")]) {
                    sh """
                    echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin
                    echo Pushing image ${DOCKERHUB_USER}/${APP_NAME}:${COMMIT_ID} to DockerHub...}
                    docker push ${DOCKERHUB_USER}/${APP_NAME}:${COMMIT_ID}
                    docker logout || true
                    """
                }
            }
        }
        stage('Deploy to local K8s') {
            when {
                anyOf {
                    changeset "api/**"
                    triggeredBy 'UserIdCause'
                }
            }
            steps {
                echo "Deploying to local K8s cluster..."
                sh """
                kubectl apply -f k8s/mongo-pv-pvc.yml --kubeconfig=${KUBECONFIG}
                kubectl apply -f k8s/configmap.yml --kubeconfig=${KUBECONFIG}
                kubectl apply -f k8s/secrets.yml --kubeconfig=${KUBECONFIG}
                kubectl apply -f k8s/nodejs-deployment.yml --kubeconfig=${KUBECONFIG}
                kubectl apply -f k8s/mongodb-deployment.yml --kubeconfig=${KUBECONFIG}
                kubectl apply -f k8s/mongo-express-deployment.yml --kubeconfig=${KUBECONFIG}
                kubectl set image deployment/nodejs-deployment nodejs-container=${DOCKERHUB_USER}/${APP_NAME}:${COMMIT_ID} --kubeconfig=${KUBECONFIG}
                echo "Verify pod creation..."
                kubectl get pods --kubeconfig=${KUBECONFIG}
                """
            }
        }
    }

    post {
        success {
            mail to: "kujtimpllanadev@gmail.com",
                subject: "SUCCESS: Jenkins Pipeline '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The pipeline '${env.JOB_NAME} [${env.BUILD_NUMBER}]' succeeded."
        }

        failure {
            mail to: "kujtimpllanadev@gmail.com",
                subject: "FAILURE: Jenkins Pipeline '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: "The pipeline '${env.JOB_NAME} [${env.BUILD_NUMBER}]' failed."
        }
    }
}