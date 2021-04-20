Feature: User invests in ELYFI

   User invest in moneypool directly
   Background: Moneypool configuration
      Given Eth moneypool is not paused // Eth 머니풀은 pause가 아니다.

   Scenario: Invest Moneypool // 머니풀에 투자한다
      Given Eth balance of User was 100 // 유저가 100eth를 보유하고 있다.
      When User invests 100eth to MoneyPool // 유저가 100eth를 머니풀에 투자한다.
      Then 100 LEth is minted to User // LEth 100개가 유저에게 발행된다.
      And 100 eth is send to Moneypool // Eth 100개가 머니풀로 전송된다.

   Scenario: Increasing moneypool investment // 유저의 머니풀 투자금이 증가한다.
      Given Eth balance of User was 100 // 유저가 LEth 100개를 보유하고 있다.
      And Time passes // 시간이 지난다.
      When User check LEth balacne // 유저가 LEth 잔고를 확인한다.
      Then LEth balance increases by 101 //LEth 잔고가 101개로 증가한다.

   Scenario: Withdraw moneypool investment // 머니풀 투자를 회수한다
      Given LEth balance of User was 101 // 유저가 LEth 101개를 보유하고 있다.
      When User withdraws 101eth from Moneypool // 유저가 LEth 101를 머니풀로부터 회수한다.
      Then Underlying 101eth is send to User // 101eth가 유저에게 전송된다.
      And 101 Leth is burned from User // 101Leth 가 소각된다.

   Scenario: Withdraw moneypool investment without // 머니풀 투자금이 부족하지만 회수한다.
      Given LToken balance of User is 0 // 유저가 LEth 0개를 보유하고 있다.
      When User withdraws 100eth from Moneypool // 유저가 LEth 100개를 머니풀에 회수한다.
      Then Withdraw is rejected due to "Not enough LToken Balance" // 회수 트랜잭션이 실행되지 않는다.

   User invest in ABToken
   Background: ABToken state
      Given // ABToken에 투자할 수 있는 금액이 충분하다
   Background: Moneypool configuration
      Given Eth moneypool is not paused // Eth 머니풀은 pause가 아니다.
   # Assuming that 1 Atoken = 1Dai // 1개의 AToken = 1다이 라고 간주, 기획에 의해 변경될 수 있음.

   Scenario: Invest ABToken // ABToken에 투자한다.
      Given Dai balance of User was 100 // 유저가 100dai를 보유하고 있다.
      And User selected ABToken to invest // 투자할 ABToken을 선택했다.
      When User invests 100dai to ABToken // ABToken에 100dai를 투자한다.
      Then 100AToken of selected ABToken is minted to User // 선택한 ABToken에 대한 100AToken이 유저에게 발행된다.
      And 100dai is transfered to Moneypool from User // 100dai가 유저에서 머니풀로 전송된다.

   Scenario: Refund AToken // AToken을 환매한다.
      Given AToken balance of User was 100 // 유저가 100 AToken을 보유하고 있다.
      When User refund 100 AToken // 유저가 100 AToken을 환매한다.
      Then 100 dai is transfered to User from Moneypool // 100dai가 머니풀에서 유저로 전송된다.

   Scenario: Interest accrued  // 이자가 누적된다.
      Given AToken balance of User was 100 // 유저가 AToken을 보유하고 있다.
      And Time passed // 시간이 지났다.
      When User check accrued interest // 유저가 누적된 이자를 확인한다.
      Then // 누적된 이자를 확인할 수 있다.

   Scenario: Claim interest // 이자를 찾아간다.
      Given User had AToken interest accrued, 10eth // 유저에게 보유중인 누적된 AToken 이자가 있다.
      When User claim accrued interest // 유저가 이자를 찾아간다.
      Then 10eth is send to User from Moneypool // 유저에게 누적된 이자인 10eth가 전송된다.
