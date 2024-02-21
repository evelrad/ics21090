// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CharityLottery {
    address public manager; 
    address[] public players; 
    address[] public winners; 
    event TicketPurchased(address player, string item); 
    mapping(address => mapping(string => uint256)) public tickets; 
    bool public lotteryClosed;
    uint public winningItem; 

    event PlayerEntered(address indexed player, string item);
    event WinnerPicked(address indexed winner);
    
    modifier canEnterLottery() {
        require(!lotteryClosed, "Lottery is closed");
        require(msg.sender != manager, "Manager cannot participate");
        _;
    }

    constructor() {
        manager = msg.sender;
        lotteryClosed = false;
    }

    modifier restricted() {
        require(msg.sender == manager || msg.sender == 0x153dfef4355E823dCB0FCc76Efe942BefCa86477, "Unauthorized access");
        _;
    }

    function enter(string memory item) public payable {
        
        tickets[msg.sender][item]++;
        players.push(msg.sender);

        emit PlayerEntered(msg.sender, item);
        emit TicketPurchased(msg.sender, item); // Πυροδότηση γεγονότος όταν αγοράζεται ένα λαχνό
    }


    function pickWinner() public restricted {
        require(!lotteryClosed, "Lottery is closed");
        require(players.length > 0, "No players participated in the lottery");

        uint index = random() % players.length;
        winners.push(players[index]);
        emit WinnerPicked(players[index]);

         resetLottery();
    }


    address[3] public lastWinners; // Αποθήκευση των τριών τελευταίων νικητών

    // Λειτουργία "Am I Winner" που επιστρέφει τον αριθμό του αντικειμένου που κέρδισε ο χρήστης
    function amIWinner() public view returns (uint) {
        for (uint i = 0; i < lastWinners.length; i++) {
            if (lastWinners[i] == msg.sender) {
                return i + 1;
            }
        }
        return 0;
    }

    // Λειτουργία "Declare Winner" που πραγματοποιεί την κλήρωση
    function declareWinner() public restricted {
        require(!lotteryClosed, "Lottery is closed");
        require(players.length > 0, "No players participated in the lottery");

        for (uint i = 0; i < 3; i++) {
            uint index = random() % players.length;
            lastWinners[i] = players[index];
        }

        resetLottery();
    }

    function resetLottery() public restricted {
    require(lotteryClosed, "Lottery is not closed yet");

    delete players;
    delete winners;
    lotteryClosed = false;
    }

    function destroyContract() public restricted {
        selfdestruct(payable(manager));
    }

    function transferOwnership(address newOwner) public restricted {
    require(newOwner != address(0), "Invalid new owner address");
    manager = newOwner;
    }

    function onWithdraw() public restricted {
    require(!lotteryClosed, "Lottery is closed");
    require(address(this).balance > 0, "Contract balance is zero");

    address payable contractOwner = payable(manager);
    contractOwner.transfer(address(this).balance);
    }


    function random() private view returns (uint) {
        return uint(block.timestamp);
    }

    function getTickets(address player, string memory item) public view returns (uint256) {
        return tickets[player][item];
    }

    function getPlayers() public view returns (uint256) {
        return players.length;
    }

    function getWinners() public view returns (uint256) {
        return winners.length;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
