Feature: Depositor deposits in ELYFI

   Depositor deposits in moneypool
   Background: Moneypool configuration
      Given Eth moneypool is not paused

   Background: Update Reserve state
      Given Indexes of lToken should be updated before every depositing
      And Interest Rate should be updated after every depositing

   Scenario: Deposit Moneypool
      Given Eth balance of Depositor was 100
      And Depositor approved protocol in case of ERC20
      When Depositor deposits 100eth to MoneyPool
      Then 100 LEth is minted to Depositor
      And 100 eth is send to Moneypool

   Scenario: Increasing moneypool deposit
      Given Eth balance of Depositor was 100
      And Time passes
      When Depositor check LEth balacne
      Then LEth balance increases by 101

   Scenario: Withdraw moneypool deposit
      Given LEth balance of Depositor was 101
      When Depositor withdraws 101eth from Moneypool
      Then Underlying 101eth is send to Depositor
      And 101 Leth is burned from Depositor

   Scenario: Withdraw moneypool deposit without LToke
      Given LToken balance of Depositor is 0
      When Depositor withdraws 100eth from Moneypool
      Then Withdraw is rejected due to "Not enough LToken Balance"