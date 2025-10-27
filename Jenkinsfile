pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "kujtimpllana/node-app"
        IMAGE_TAG = "${GIT_COMMIT}"
        KUBECONFIG = "${env.HOME}/.kube/config"
    }

    stages {
        stage('Checkout') {
            // when {
            //     changeset "api/**"
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
                changeset "**/api/**"
            }
            steps {
                echo "Building docker image..."
                sh "cd /api"
                sh "docker build -t $DOCKER_IMAGE:$IMAGE_TAG ."
            }
        }
        stage('Jest testing') {
            when {
                changeset "api/**"
            }
            steps {
                echo "Running Jest unit tests..."
                sh "cd /api"
                sh "docker run --rm -v $WORKSPACE:/app $DOCKER_IMAGE:$IMAGE_TAG npm test"
            }
            post {
                always {
                    echo "Adding test report info to an xml file..."
                    sh "junit jest-junit.xml"
                    
                }
            }
        }
        stage('Push to Docker Hub') {
            when {
                changeset "**/api/**"
            }
            steps {
                withCredentials([usernamePassword(credentialsId: "dockerhub-creds", usernameVariable: "DOCKER_USER", passwordVariable: "DOCKER_PASS")]) {
                    sh "echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin"
                    echo "Pushing image $DOCKER_IMAGE:$IMAGE_TAG to DockerHub...}"
                    sh "docker push $DOCKER_IMAGE:$IMAGE_TAG"
                    sh "docker logout || true"
                }
            }
        }
        stage('Deploy to local K8s') {
            when {
                changeset "api/**"
            }
            steps {
                echo "Deploying to local K8s cluster..."
                sh "kubectl set image deployment/node-mongo-deployment node-app=$DOCKER_IMAGE:$IMAGE_TAG --kubeconfig=$KUBECONFIG"
                sh "kubectl apply -f k8s/mongo-pv-pvc.yml --kubeconfig=$KUBECONFIG"
                sh "kubectl apply -f k8s/deployment.yml --kubeconfig=$KUBECONFIG"
                sh "kubectl apply -f k8s/service.yml --kubeconfig=$KUBECONFIG"
                echo "Verify pod creation..."
                sh "kubectl get pods --kubeconfig=$KUBECONFIG"
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