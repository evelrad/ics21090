import React, { Component } from 'react'; // Εισαγωγή απαραίτητων βιβλιοθηκών
import web3 from './web3'; // Εισαγωγή web3 για την αλληλεπίδραση με το Ethereum
import lottery from './loterry'; // Εισαγωγή του συμβολαίου lottery
import './App.css'; // Εισαγωγή CSS αρχείου για την εμφάνιση της εφαρμογής

class App extends Component {
  state = { // Αρχική κατάσταση της εφαρμογής
    manager: '', // Διεύθυνση του διαχειριστή του συμβολαίου
    players: [], // Λίστα με τους συμμετέχοντες στον λαχειοφόρο
    balance: 0, // Υπόλοιπο του συμβολαίου
    value: '', // Τιμή που εισάγει ο χρήστης
    message: '', // Μήνυμα επικοινωνίας με τον χρήστη
    currentAccount: '', // Τρέχουσα διεύθυνση του χρήστη
    carTickets: 0, // Αρχικός αριθμός εισιτηρίων για το αυτοκίνητο
    phoneTickets: 0, // Αρχικός αριθμός εισιτηρίων για το τηλέφωνο
    computerTickets: 0, // Αρχικός αριθμός εισιτηρίων για τον υπολογιστή
    newOwner: '' // Διεύθυνση του νέου ιδιοκτήτη
  };

  async componentDidMount() { // Μέθοδος που εκτελείται μετά την αρχικοποίηση του component
    try {

      
      const manager = await lottery.methods.manager().call(); // Λήψη της διεύθυνσης του διαχειριστή
      const players = await lottery.methods.getPlayers().call(); // Λήψη της λίστας των παικτών
      const balance = await web3.eth.getBalance(lottery.options.address); // Λήψη του υπολοίπου του συμβολαίου
      this.setState({ manager, players, balance }); // Ενημέρωση της κατάστασης με τα νέα δεδομένα

      const accounts = await web3.eth.getAccounts(); // Λήψη των διαθέσιμων λογαριασμών
      const currentAccount = accounts[0]; // Η πρώτη διεύθυνση θεωρείται η τρέχουσα
      this.setState({ currentAccount }); // Ενημέρωση της τρέχουσας διεύθυνσης στην κατάσταση

      // Παρακολούθηση γεγονότων TicketPurchased
      lottery.events.TicketPurchased().on('data', (event) => {
          this.refreshData(); // Ενημέρωση των δεδομένων μετά από κάθε γεγονός TicketPurchased
        })
        .on('error', console.error);
    } catch (error) {
      this.setState({ message: error.message }); // Εμφάνιση σφάλματος στον χρήστη
    }

    function startAutoRefresh() {
    setInterval(async function() {
        try {
            const players = await lottery.methods.getPlayers().call(); // Λήψη της λίστας των παικτών
            const balance = await web3.eth.getBalance(lottery.options.address); // Λήψη του υπολοίπου του συμβολαίου
            const carTickets = await lottery.methods.getTicketCount('Car').call(); // Λήψη αριθμού εισιτηρίων για το αυτοκίνητο
            const phoneTickets = await lottery.methods.getTicketCount('Phone').call(); // Λήψη αριθμού εισιτηρίων για το τηλέφωνο
            const computerTickets = await lottery.methods.getTicketCount('Computer').call(); // Λήψη αριθμού εισιτηρίων για τον υπολογιστή
            
            // Ενημέρωση της κατάστασης με τα νέα δεδομένα
            this.setState({ players, balance, carTickets, phoneTickets, computerTickets }); 
        } catch (error) {
            // Ενημέρωση του μηνύματος σφάλματος στον χρήστη σε περίπτωση σφάλματος
            console.error("Error during auto refresh:", error);
        }
      }.bind(this), 5000); // Ανανέωση κάθε 5 δευτερόλεπτα
    }


    // Κλήση της συνάρτησης για εκκίνηση της αυτόματης ανανέωσης
    startAutoRefresh();
    setInterval(startAutoRefresh, 5000); // Ανανέωση κάθε 5 δευτερόλεπτα


  }

  

  // Μέθοδος για ανανέωση των δεδομένων
  refreshData = async () => {
    try {
      const players = await lottery.methods.getPlayers().call(); // Λήψη της λίστας των παικτών
      const balance = await web3.eth.getBalance(lottery.options.address); // Λήψη του υπολοίπου του συμβολαίου
      this.setState({ players, balance }); // Ενημέρωση της κατάστασης με τα νέα δεδομένα
    } catch (error) {
      this.setState({ message: error.message }); // Εμφάνιση σφάλματος στον χρήστη
    }
  }

  onSubmit = async (event, item) => { // Μέθοδος υποβολής συμμετοχής
    event.preventDefault();
    this.setState({ message: 'Waiting on transaction success...' }); // Εμφάνιση μηνύματος αναμονής

    try {
      await lottery.methods.enter(item).send({ // Κλήση μεθόδου enter του συμβολαίου
        from: this.state.currentAccount, // Από τον τρέχοντα λογαριασμό
        value: web3.utils.toWei('0.01', 'ether') // Μετατροπή σε wei
      });

      this.setState({ message: 'You have been entered!' }); // Εμφάνιση επιτυχούς συμμετοχής
    } catch (error) {
      this.setState({ message: `Error entering lottery: ${error.message}` }); // Εμφάνιση σφάλματος στον χρήστη
    }
  };

    // Μέθοδος που εκτελείται όταν ο χρήστης κάνει κλικ σε ένα κουμπί για να δηλώσει έναν νικητή
  onClick = async () => {
    // Ορίζουμε ένα μήνυμα που θα εμφανιστεί στον χρήστη για την πορεία της συναλλαγής
    this.setState({ message: 'Waiting on transaction success...' });
    try {
      // Καλούμε τη μέθοδο pickWinner από το συμβόλαιο του λαχείου
      // για να επιλέξουμε έναν νικητή και να πραγματοποιήσουμε τη συναλλαγή
      await lottery.methods.pickWinner().send({
        from: this.state.currentAccount // Χρησιμοποιούμε τον τρέχοντα λογαριασμό ως αποστολέα της συναλλαγής
      });
      // Αν η συναλλαγή εκτελεστεί επιτυχώς, ενημερώνουμε το μήνυμα του χρήστη
      this.setState({ message: 'A winner has been picked!' });
    } catch (error) {
      // Αν υπάρξει σφάλμα κατά την εκτέλεση της συναλλαγής, ενημερώνουμε το μήνυμα του χρήστη με το αντίστοιχο σφάλμα
      this.setState({ message: `Error picking winner: ${error.message}` });
    }
  };

  // Μέθοδος που εκτελείται όταν ο χρήστης θέλει να ελέγξει αν είναι νικητής
  onAmIWinner = async () => {
    this.setState({ message: 'Checking if you are a winner...' });
    try {
      // Καλούμε τη μέθοδο amIWinner από το συμβόλαιο του λαχείου
      // για να ελέγξουμε αν ο τρέχων λογαριασμός έχει κερδίσει κάποιο αντικείμενο
      const result = await lottery.methods.amIWinner().call({
        from: this.state.currentAccount // Χρησιμοποιούμε τον τρέχοντα λογαριασμό ως αποστολέα του αιτήματος
      });
      if (result > 0) {
        // Αν ο χρήστης είναι νικητής, ενημερώνουμε το μήνυμα του χρήστη με το αντίστοιχο μήνυμα
        this.setState({ message: `Congratulations! You won item ${result}` });
      } else {
        // Αν ο χρήστης δεν είναι νικητής, ενημερώνουμε το μήνυμα του χρήστη αντίστοιχα
        this.setState({ message: 'Sorry, you did not win anything' });
      }
    } catch (error) {
      // Αν υπάρξει σφάλμα κατά τον έλεγχο, ενημερώνουμε το μήνυμα του χρήστη με το αντίστοιχο σφάλμα
      this.setState({ message: `Error checking if you are a winner: ${error.message}` });
    }
  };

  // Μέθοδος που εκτελείται όταν ο χρήστης θέλει να δηλώσει έναν νικητή
  onDeclareWinner = async () => {
    this.setState({ message: 'Declaring winners...' });
    try {
      // Καλούμε τη μέθοδο declareWinner από το συμβόλαιο του λαχείου
      // για να δηλώσουμε έναν νικητή και να πραγματοποιήσουμε τη συναλλαγή
      await lottery.methods.declareWinner().send({
        from: this.state.currentAccount // Χρησιμοποιούμε τον τρέχοντα λογαριασμό ως αποστολέα της συναλλαγής
      });
      // Αν η συναλλαγή εκτελεστεί επιτυχώς, ενημερώνουμε το μήνυμα του χρήστη
      this.setState({ message: 'Winners declared!' });
      // Καλούμε τη μέθοδο refreshData για να ενημερώσουμε τα δεδομένα της εφαρμογής
      await this.refreshData();
    } catch (error) {
      // Αν υπάρξει σφάλμα κατά την εκτέλεση της συναλλαγής, ενημερώνουμε το μήνυμα του χρήστη με το αντίστοιχο σφάλμα
      this.setState({ message: `Error declaring winners: ${error.message}` });
    }
  };

  // Μέθοδος που εκτελείται όταν ο ιδιοκτήτης θέλει να ξεκινήσει ένα νέο κύκλο
  onStartNewCycle = async () => {
    try {
      // Λαμβάνουμε τους διαθέσιμους λογαριασμούς του χρήστη
      const accounts = await web3.eth.getAccounts();
      // Βρίσκουμε τον ιδιοκτήτη του συμβολαίου λαχείου
      const contractOwner = await lottery.methods.manager().call();
      
      // Έλεγχος αν ο χρήστης που ξεκίνησε τη λειτουργία είναι ο ιδιοκτήτης του συμβολαίου
      if (accounts[0] !== contractOwner) {
        // Αν δεν είναι ο ιδιοκτήτης, ενημερώνουμε το μήνυμα του χρήστη με σχετικό μήνυμα
        this.setState({ message: 'Only contract owner can start a new cycle.' });
        return;
      }

      // Καλούμε τη μέθοδο resetLottery από το συμβόλαιο του λαχείου
      // για να ξεκινήσουμε ένα νέο κύκλο αγοράς λαχείων
      await lottery.methods.resetLottery().send({
        from: accounts[0] // Χρησιμοποιούμε τον τρέχοντα λογαριασμό ως αποστολέα της συναλλαγής
      });

      // Αν η συναλλαγή εκτελεστεί επιτυχώς, ενημερώνουμε το μήνυμα του χρήστη
      this.setState({ message: 'New lottery cycle started.' });
    } catch (error) {
      // Αν υπάρξει σφάλμα κατά την εκτέλεση της συναλλαγής, ενημερώνουμε το μήνυμα του χρήστη με το αντίστοιχο σφάλμα
      this.setState({ message: `Error starting new cycle: ${error.message}` });
    }
  }

  // Μέθοδος που εκτελείται όταν ο ιδιοκτήτης θέλει να μεταφέρει την ιδιοκτησία του συμβολαίου
  onTransferOwnership = async () => {
    try {
      // Λαμβάνουμε τους διαθέσιμους λογαριασμούς του χρήστη
      const accounts = await web3.eth.getAccounts();
      // Λαμβάνουμε τη νέα διεύθυνση που θα γίνει ο νέος ιδιοκτήτης του συμβολαίου
      const newOwner = this.state.newOwner;

      // Καλούμε τη μέθοδο transferOwnership από το συμβόλαιο του λαχείου
      // για να μεταφέρουμε την ιδιοκτησία του συμβολαίου στη νέα διεύθυνση
      await lottery.methods.transferOwnership(newOwner).send({
        from: accounts[0] // Χρησιμοποιούμε τον τρέχοντα λογαριασμό ως αποστολέα της συναλλαγής
      });

      // Αν η συναλλαγή εκτελεστεί επιτυχώς, ενημερώνουμε το μήνυμα του χρήστη
      this.setState({ message: `Ownership transferred to ${newOwner}` });
    } catch (error) {
      // Αν υπάρξει σφάλμα κατά την εκτέλεση της συναλλαγής, ενημερώνουμε το μήνυμα του χρήστη με το αντίστοιχο σφάλμα
      this.setState({ message: `Error transferring ownership: ${error.message}` });
    }
  }

  // Μέθοδος που εκτελείται όταν ο ιδιοκτήτης θέλει να καταστρέψει το συμβόλαιο
  onDestroyContract = async () => {
    try {
      // Λαμβάνουμε τους διαθέσιμους λογαριασμούς του χρήστη
      const accounts = await web3.eth.getAccounts();
      // Βρίσκουμε τον ιδιοκτήτη του συμβολαίου λαχείου
      const contractOwner = await lottery.methods.manager().call();
      
      // Έλεγχος αν ο χρήστης που ξεκίνησε τη λειτουργία είναι ο ιδιοκτήτης του συμβολαίου
      if (accounts[0] !== contractOwner) {
        // Αν δεν είναι ο ιδιοκτήτης, ενημερώνουμε το μήνυμα του χρήστη με σχετικό μήνυμα
        this.setState({ message: 'Only contract owner can destroy the contract.' });
        return;
      }

      // Καλούμε τη μέθοδο destroyContract από το συμβόλαιο του λαχείου
      // για να καταστρέψουμε το συμβόλαιο
      await lottery.methods.destroyContract().send({
        from: accounts[0] // Χρησιμοποιούμε τον τρέχοντα λογαριασμό ως αποστολέα της συναλλαγής
      });

      // Αν η συναλλαγή εκτελεστεί επιτυχώς, ενημερώνουμε το μήνυμα του χρήστη
      this.setState({ message: 'Contract destroyed.' });
    } catch (error) {
      // Αν υπάρξει σφάλμα κατά την εκτέλεση της συναλλαγής, ενημερώνουμε το μήνυμα του χρήστη με το αντίστοιχο σφάλμα
      this.setState({ message: `Error destroying contract: ${error.message}` });
    }
  }


    

   render() {
    return (
      <div>
        <h1>Lottery DApp</h1>
        <p>Current Metamask Wallet Address: {this.state.currentAccount}</p>
        <p>Contract Owner Address: {this.state.manager}</p>
        <p>Total Contract Balance: {this.state.balance}</p>
        <p>{this.state.message}</p>
        <div>
        <h2>Car</h2>
            <p>Tickets: {this.state.carTickets}</p>
              <button onClick={(e) => this.onSubmit(e, 'car')}>Bid</button>
              <img src="https://img.freepik.com/premium-photo/blue-premium-business-sedan-car-sports-configuration-white-background-3d-rendering_101266-26564.jpg" alt="Car Image" />
        </div>
        <div>
       <h2>Phone</h2>
            <p>Tickets: {this.state.phoneTickets}</p>
              <button onClick={(e) => this.onSubmit(e, 'phone')}>Bid</button>
              <img src="https://img.lovepik.com/free-png/20210928/lovepik-mobile-phone-png-image_401663651_wh1200.png" alt="Phone Image" />
        </div>
        <div>
          <h2>Computer</h2>
            <p>Tickets: {this.state.computerTickets}</p>
              <button onClick={(e) => this.onSubmit(e, 'computer')}>Bid</button>
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2d/Desktop.jpg" alt="Computer Image" />
       </div>
        <div>
          <button>Reveal</button>
          <div>
          <button onClick={this.onAmIWinner}>Am I Winner</button>
          <button onClick={this.onDeclareWinner}>Declare Winner</button>
          </div>
          <p>Winning Item: {this.state.winningItem}</p>
          <button onClick={this.onWithdraw}>Withdraw</button>
        </div>
          <div>
            <button onClick={this.onStartNewCycle}>Start New Cycle</button>
          </div>
          <div>
            <input
              type="text"
              value={this.state.newOwner}
              onChange={(e) => this.setState({ newOwner: e.target.value })}
              placeholder="New Owner Address"
            />
            <button onClick={this.onTransferOwnership}>Transfer Ownership</button>
          </div>
          <div>
            <button onClick={this.onDestroyContract}>Destroy Contract</button>
          </div>
      </div>
    );
  }
}

export default App;
