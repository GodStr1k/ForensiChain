// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ForensicEvidence {
    uint256 public nextEventId = 1;

    struct EvidenceRecord {
        string caseId;
        string evidenceId;
        string evidenceHash;
        string prevHash;
        string metadataHash;
        address registeredBy;
        uint256 timestamp;
    }

    mapping(string => EvidenceRecord) public registry;

    event EvidenceEvent(
        uint256 indexed eventId,
        string evidenceId,
        string eventType,
        string evidenceHash,
        address indexed investigator,
        uint256 timestamp
    );

    function registerEvidence(
        string calldata caseId,
        string calldata evidenceId,
        string calldata evidenceHash,
        string calldata prevHash,
        string calldata metadataHash
    ) external returns (uint256) {
        require(bytes(registry[evidenceId].evidenceId).length == 0, "Evidence already registered");
        
        registry[evidenceId] = EvidenceRecord({
            caseId: caseId,
            evidenceId: evidenceId,
            evidenceHash: evidenceHash,
            prevHash: prevHash,
            metadataHash: metadataHash,
            registeredBy: msg.sender,
            timestamp: block.timestamp
        });

        uint256 eventId = nextEventId++;
        emit EvidenceEvent(eventId, evidenceId, "REGISTERED", evidenceHash, msg.sender, block.timestamp);
        return eventId;
    }

    function recordAccess(string calldata evidenceId, string calldata evidenceHash) external returns (uint256) {
        uint256 eventId = nextEventId++;
        emit EvidenceEvent(eventId, evidenceId, "ACCESSED", evidenceHash, msg.sender, block.timestamp);
        return eventId;
    }

    function recordAnalysis(
        string calldata evidenceId,
        string calldata evidenceHash,
        string calldata analysisType
    ) external returns (uint256) {
        uint256 eventId = nextEventId++;
        emit EvidenceEvent(eventId, evidenceId, analysisType, evidenceHash, msg.sender, block.timestamp);
        return eventId;
    }

    function recordTransfer(
        string calldata evidenceId,
        string calldata evidenceHash,
        address fromInvestigator,
        address toInvestigator
    ) external returns (uint256) {
        uint256 eventId = nextEventId++;
        emit EvidenceEvent(eventId, evidenceId, "TRANSFERRED", evidenceHash, msg.sender, block.timestamp);
        return eventId;
    }

    function recordVerification(
        string calldata evidenceId,
        string calldata registeredHash,
        string calldata currentHash,
        bool isVerified
    ) external returns (uint256) {
        uint256 eventId = nextEventId++;
        string memory eventType = isVerified ? "VERIFICATION_SUCCESS" : "VERIFICATION_FAILURE";
        emit EvidenceEvent(eventId, evidenceId, eventType, currentHash, msg.sender, block.timestamp);
        return eventId;
    }
}
