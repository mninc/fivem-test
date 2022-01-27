/*global GetParentResourceName*/

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';


/*
fetch(`https://${GetParentResourceName()}/selectedOption`, {
            method: 'POST',
            body: JSON.stringify({ option })
        });
        */
class Bank extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            visible: false,
            accounts: [],
            withdrawAmount: 0,
            withdrawAccount: 0,
            transactions: [],
        };
        this.withdrawAmount = "abc";

        this.handleCashChange = this.handleCashChange.bind(this);
    }

    withdrawCash() {
        console.log("withdraw", this.withdrawAmount);
    }

    handleCashChange(action) {
        fetch(`https://${GetParentResourceName()}/cashChange`, {
            method: 'POST',
            body: JSON.stringify({ action, amount: this.state.withdrawAmount, accountNumber: this.state.withdrawAccount })
        });
        this.setState({
            visible: false
        });
    }

    loadTransactions(id) {
        this.setState({
            transactions: []
        });
        fetch(`https://${GetParentResourceName()}/loadTransactions`, {
            method: 'POST',
            body: JSON.stringify({ accountNumber: id })
        });
    }

    render() {
        if (!this.state.visible) return null;

        let accounts = [];
        for (let i = 0; i < this.state.accounts.length; i++) {
            let account = this.state.accounts[i];
            accounts.push(
                <div className="account" id={account.id} onClick={() => this.loadTransactions(account.id)}>
                    <p>Account number: {account.id}</p>
                    <p>Account balance: ${account.balance}</p>
                    <input type="number" value={this.state.withdrawAccount === account.id ? (this.state.withdrawAmount || 0) : 0} onChange={event => this.setState({withdrawAmount: parseInt(event.target.value), withdrawAccount: account.id})} />
                    <button onClick={() => this.handleCashChange("withdraw")}>Withdraw</button>
                    <button onClick={() => this.handleCashChange("deposit")}>Deposit</button>
                </div>
            )
        }
        let transactions = [];
        for (let i = 0; i < this.state.transactions.length; i++) {
            let transaction = this.state.transactions[i];
            transactions.push(
                <div className="transaction" id={transaction._id}>
                    <p>Amount: ${transaction.amount}</p>
                    <p>Type: {transaction.transactionType}</p>
                    <p>At: {transaction.at}</p>
                </div>
            )
        }

        return (
            <div className="bank">
                <div className="accounts">
                    {accounts}
                </div>
                <div className="transactions">
                    {transactions}
                </div>
            </div>
        )

    }
}

const bank = ReactDOM.render(
    <Bank />,
    document.getElementById('root')
);

console.log("listener set up");
window.addEventListener('message', (event) => {
    let data = event.data;
    if (data.action === 'open_atm') {
        bank.setState({
            visible: true,
            accounts: data.accounts,
            withdrawAmount: 0,
            withdrawAccount: 0
        })
    } else if (data.action === "transactions") {
        bank.setState({
            transactions: data.transactions
        });
    }
});

document.addEventListener('keydown', e => {
    if (e.code === "Escape") {
        bank.setState({
            visible: false
        });
        fetch(`https://${GetParentResourceName()}/close`, {
            method: 'POST'
        });
    }
});
