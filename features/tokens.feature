Feature: User interacts with Tokens
   User interacts with LToken - Transfer
   Background: Moneypool configuration
      Given Eth moneypool is not paused

   @Todo1
   Scenario: Transfer LToken
      Given LEth balance of User was 100
      And LEth balance of User2 was 0
      And Health Factor after sending 50 Leth was over 1
      When User transfers 50LEth to User2
      Then LToken balance of User is 50
      And LToken balance of User2 is 50
      And LTV of User increases
      And Health Factor of User increases

   Scenario: Transfer LToken not allowed
      Given LEth balance of User was 100
      And Health Factor after sending 50 Leth was under 1
      When User transfers 50LEth to User2
      Then Transfer is rejected due to "Transfer rejected"

   User interacts with ABToken - Mint
   Background: The off-chain contract

   @Todo2
   Scenario: Collateral service provider mints empty asset bond token
      Given Borrower who borrow against real asset submitted the information of real asset
      When Collateral service provider mints empty asset bond token with information and loan agreements
      Then ABToken minted with information and loan agreements

   Scenario: Borrower signs empty asset bond token
      Given Borrower confirmed empty asset bond token
      And Borrower concluded agreements
      When Borrower signs empty asset bond token
      Then empty asset bond token is transferred to Council

   Scenario: Council signs empty asset bond token
      Given Borrower signed empty asset bond token
      And empty asset bond token is transferred to Council
      When Council signs empty asset bond token
      Then empty asset bond token becomes ABToken which is qualified for being collateral

   User interacts with ABToken - Burn
   Background: Maturation
      Given ABToken delinquent

   Scenario: Burn ABToken after bond maturation
      Given Collateral service provider redeemed ABToken after repaying loan
      And Collateral service provider send the request Borrower for burning ABToken
      When Borrower signs the burn request
      Then ABToken burned