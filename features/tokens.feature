Feature: User interacts with Tokens
   User interacts with LToken - Transfer
   Background: Moneypool configuration
      Given Eth moneypool is not paused // Eth 머니풀은 pause가 아니다.

   @Todo1
   Scenario: Transfer LToken // LToken을 전송한다
      Given LEth balance of User was 100 // 유저가 100Leth를 보유하고 있다.
      And LEth balance of User2 was 0 // 유저2가 0Leth를 보유하고 있다.
      And Health Factor after sending 50 Leth was over 1 // 전송한 뒤의 Health Factor는 1 이상이다.
      When User transfers 50LEth to User2 // 유저는 50LEth를 유저2에게 전송한다
      Then LToken balance of User is 50
      And LToken balance of User2 is 50
      And LTV of User increases // 유저의 LTV가 증가한다
      And Health Factor of User increases // 유저의 Health factor가 증가한다

   Scenario: Transfer LToken not allowed // LToken이 전송되지 않는다
      Given LEth balance of User was 100 // 유저가 100Leth를 보유하고 있다.
      And Health Factor after sending 50 Leth was under 1 // 전송한 뒤의 Health Factor는 1 이하이다.
      When User transfers 50LEth to User2 // 유저는 50LEth를 유저2에게 전송한다
      Then Transfer is rejected due to "Transfer rejected" // 전송 트랜잭션이 실행되지 않는다.

   User interacts with ABToken - Mint
   Background: The off-chain contract  // 현실의 계약은 모두 완료됨.

   @Todo2
   Scenario: Co mints pre-ABToken // 담보법인이 pre-ABToken을 발행한다.
      Given Borrower who borrow against real asset submitted the information of real asset
      When Co mints pre-ABToken with information and loan agreements
      Then ABToken minted with information and loan agreements

   Scenario: Borrower signs pre-ABToken // 대출자가 pre-ABToken에 서명한다
      Given Borrower confirmed pre-ABToken
      And Borrower concluded agreements // 차입자가 pre-ABToken을 확인하고 계약을 완료한다.
      When Borrower signs pre-ABToken // 차입자가 ABToken에 서명한다.
      Then pre-ABToken is transferred to Law Firm // ABToken은 로펌에게 전송된다.

   Scenario: Law Firm signs pre-ABToken // 로펌이 pre-ABToken에 서명한다.
      Given Borrower signed pre-ABToken // 차입자는 pre-ABToken에 서명했다.
      And pre-ABToken is transferred to Law Firm // ABToken은 로펌에게 전송되었다.
      When Law Firm signs pre-ABToken // 로펌은 pre-ABToken에 서명한다.
      Then pre-ABToken becomes ABToken which is qualified for being collateral // pre-ABToken은 담보로 예치될 수 있는 ABToken이 된다.

   User interacts with ABToken - Burn
   Background: Maturation
      Given ABToken matured // ABToken은 만기되었다.

   @Todo6
   Scenario: Burn ABToken after bond maturation // 채권 만료 후 ABToken을 소각한다.
      Given Co redeemed ABToken after repaying loan // 담보 법인은 대출 원금을 상환하고 ABToken을 
      And Co send the request Borrower for burning ABToken
      When Borrower signs the burn request
      Then ABToken burned