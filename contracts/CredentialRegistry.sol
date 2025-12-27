// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title CredentialRegistry
 * @dev Manages the issuance and verification of academic credentials using DID principles.
 * Stores hashes of offline credentials (IPFS) to ensure integrity.
 */
contract CredentialRegistry {
    
    // --- Data Structures ---

    struct Credential {
        address issuer;
        string studentName; // Stored on-chain for simplicity in this MVP, ideally in DID doc
        string studentDID;  // The student's DID (e.g., did:ethr:0x...)
        string courseName;
        bytes32 credHash;   // Hash of the credential data stored on IPFS
        string ipfsCID;     // Location of the full credential file
        uint256 timestamp;
        bool isValid;
        bool isRevoked;
    }

    struct Issuer {
        string name;
        bool isAuthorized;
        uint256 registeredAt;
    }

    // --- State Variables ---

    address public admin; // Gov/Regulator role
    
    // Mappings
    mapping(bytes32 => Credential) public credentials;
    mapping(address => Issuer) public authorizedIssuers;
    
    // Arrays for simpler frontend enumeration (Not gas efficient for large scale, suitable for MVP)
    bytes32[] public credentialHashes;
    address[] public issuerAddresses;

    // --- Events ---

    event IssuerAuthorized(address indexed issuerAddress, string name);
    event IssuerRevoked(address indexed issuerAddress);
    event CredentialIssued(bytes32 indexed credHash, address indexed issuer, string studentDID);
    event CredentialRevoked(bytes32 indexed credHash, address indexed issuer);

    // --- Modifiers ---

    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin/regulator");
        _;
    }

    modifier onlyIssuer() {
        require(authorizedIssuers[msg.sender].isAuthorized, "Caller is not an authorized issuer");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // --- Admin/Regulator Functions ---

    /**
     * @dev Authorize a University to issue credentials.
     */
    function authorizeIssuer(address _issuer, string memory _name) external onlyAdmin {
        authorizedIssuers[_issuer] = Issuer({
            name: _name,
            isAuthorized: true,
            registeredAt: block.timestamp
        });
        issuerAddresses.push(_issuer);
        emit IssuerAuthorized(_issuer, _name);
    }

    /**
     * @dev Revoke a University's authorization.
     */
    function revokeIssuer(address _issuer) external onlyAdmin {
        authorizedIssuers[_issuer].isAuthorized = false;
        emit IssuerRevoked(_issuer);
    }

    // --- Issuance Functions ---

    /**
     * @dev Issue a new credential.
     * @param _studentName Name of the student (e.g. "John Doe")
     * @param _studentDID DID of the student (e.g. "did:ethr:0x123...")
     * @param _courseName Name of the degree/course
     * @param _ipfsCID The IPFS CID where the JSON/PDF is stored
     * @param _credHash A keccak256 hash of the credential content for integrity
     */
    function issueCredential(
        string memory _studentName,
        string memory _studentDID,
        string memory _courseName,
        string memory _ipfsCID,
        bytes32 _credHash
    ) external onlyIssuer {
        require(credentials[_credHash].timestamp == 0, "Credential already exists");

        credentials[_credHash] = Credential({
            issuer: msg.sender,
            studentName: _studentName,
            studentDID: _studentDID,
            courseName: _courseName,
            credHash: _credHash,
            ipfsCID: _ipfsCID,
            timestamp: block.timestamp,
            isValid: true,
            isRevoked: false
        });

        credentialHashes.push(_credHash);
        emit CredentialIssued(_credHash, msg.sender, _studentDID);
    }

    /**
     * @dev Revoke a specific credential (e.g. if issued in error).
     */
    function revokeCredential(bytes32 _credHash) external onlyIssuer {
        require(credentials[_credHash].issuer == msg.sender, "Only the issuer can revoke");
        require(credentials[_credHash].isValid, "Credential already invalid");

        credentials[_credHash].isValid = false;
        credentials[_credHash].isRevoked = true;
        emit CredentialRevoked(_credHash, msg.sender);
    }

    // --- View Functions ---

    function getCredential(bytes32 _credHash) external view returns (Credential memory) {
        return credentials[_credHash];
    }

    function getAllCredentialHashes() external view returns (bytes32[] memory) {
        return credentialHashes;
    }

    function isValidCredential(bytes32 _credHash) external view returns (bool) {
        return credentials[_credHash].isValid;
    }
}
