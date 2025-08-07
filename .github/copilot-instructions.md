I am unable to create a file within a specific repository. However, I can provide you with the content for a `.github/copilot-instructions.md` file that you can copy and paste into your project.

Here is the content for the `.github/copilot-instructions.md` file, tailored for your "Leethack" project.

***

### Leethack Project - Copilot Instructions

This document provides a high-level overview of the Leethack project and offers guidance for using AI assistants like GitHub Copilot to contribute effectively.

#### 1. Project Goal

**Leethack** is a cybersecurity training platform, similar to Hack The Box and TryHackMe. Our goal is to provide a safe, isolated, and realistic environment for users to practice their penetration testing and defensive security skills. The platform will feature a variety of challenges, ranging from beginner-level CTF-style problems to complex, multi-stage network scenarios.

#### 2. Core Architecture

The system is a distributed microservice architecture written primarily in Go. It consists of the following key services:

* **`leethack-api` (Backend Server):** The central nervous system of the platform.
    * **Functionality:** User authentication, challenge management, score tracking, and orchestration command issuance.
    * **Communication:**
        * **Frontend API:** Exposes a **RESTful API** for client-side interactions (e.g., fetching challenges, submitting flags).
        * **Internal Communication:** Uses **gRPC** to send commands to the `leethack-orchestrator`.
    * **Technology Stack:** Go, PostgreSQL, Redis.

* **`leethack-orchestrator` (Orchestrator Service):** The service responsible for managing the virtualized environments.
    * **Functionality:** Receives gRPC commands from `leethack-api` to launch, manage, and tear down user-specific virtual machines.
    * **Communication:**
        * **API Interface:** Implements a **gRPC service** to receive instructions from the `leethack-api`.
        * **VM Control:** Uses **Firecracker's native RESTful API** to create and manage isolated microVMs.
    * **Technology Stack:** Go, Firecracker VMM.

* **`leethack-frontend` (Client Application):** The user-facing web application.
    * **Functionality:** Displays challenges, scoreboards, and provides an interactive interface for users to control their VMs.
    * **Communication:**
        * **Backend Communication:** Interacts with the `leethack-api` via **RESTful API calls**.
        * **Real-time Updates:** Uses **WebSockets** to receive real-time updates from the `leethack-api` (e.g., VM status, new user notifications).
    * **Technology Stack:** JavaScript (React/Vue/Svelte), WebSockets.

* **`leethack-challenge-factory` (Challenge Builder):** A separate tool/service for creating and packaging the challenge environments.
    * **Functionality:** Packages a vulnerable application and its dependencies into a minimal filesystem image and kernel, ready for deployment on Firecracker.

#### 3. AI Assistant (Copilot) Guidelines

When writing code or documentation for this project, please keep the following in mind:

* **Go and Microservices:** Assume a Go-based microservice architecture. Favor idiomatic Go code.
* **Protocol-Specific Context:** Be mindful of the communication protocols used in each service.
    * In `leethack-api`, differentiate between REST handlers for the frontend and gRPC clients for the orchestrator.
    * In `leethack-orchestrator`, focus on gRPC server implementation and Firecracker API client logic.
* **Security First:** This is a cybersecurity platform. Security is paramount. When generating code, prioritize secure coding practices, such as input validation, proper error handling, and robust authentication/authorization checks.
* **Firecracker and MicroVMs:** Recognize that the challenge environments are running in highly isolated, lightweight Firecracker microVMs. Code should reflect this and handle their lifecycle appropriately.
* **Documentation:** Generate clear and concise comments, especially for gRPC service definitions and API endpoints. DO NOT use emojis under any circumstance if you find any emojis delete them.
