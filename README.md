# ForensiChain

A Tamper-Evident Blockchain-Based Digital Evidence Provenance and Chain-of-Custody System.

## Project Overview

ForensiChain provides an immutable chain of custody for digital forensic evidence. It leverages cryptographic hashing (SHA-256) and blockchain technology to guarantee the integrity and provenance of forensic evidence, without storing the actual sensitive evidence on the blockchain.

## Technology Stack

* **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui
* **Backend:** Node.js, Express, TypeScript, Prisma ORM
* **Database:** SQLite (Development) / PostgreSQL (Production ready)
* **Blockchain:** Solidity, Hardhat, Ethers.js
* **Storage:** Secure Local Storage (for development)

> **Note:** For the local development environment in Phase 1, we are using SQLite instead of PostgreSQL to remove the dependency on Docker Desktop. The schema is identical and can be swapped back to PostgreSQL by changing the Prisma provider.

## Getting Started

*(Instructions will be added as the project is built)*
