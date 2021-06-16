Feature: Depositor deposits in ELYFI

   Depositor deposits in moneypool directly
   Background: Moneypool configuration
      Given Eth moneypool is not paused // Eth 머니풀은 pause가 아니다.

   Background: Update Reserve state
      Given Indexes of should be updated before every depositing // 투자가 발생하기 전에 Indexes가 업데이트 되어야 한다.
      And Interest Rate should be updated after every depositing // 투자가 발생한 후에 Interest Rate가 업데이트 되어야 한다.

   Scenario: Deposit Moneypool // 머니풀에 투자한다
      Given Eth balance of Depositor was 100 // 유저가 100eth를 보유하고 있다.
      And Depositor approved protocol in case of ERC20 // ERC20에 대해서 approve가 되어있다.
      When Depositor deposits 100eth to MoneyPool // 유저가 100eth를 머니풀에 투자한다.
      Then 100 LEth is minted to Depositor // LEth 100개가 유저에게 발행된다.
      And 100 eth is send to Moneypool // Eth 100개가 머니풀로 전송된다.

   Scenario: Increasing moneypool deposit // 유저의 머니풀 투자금이 증가한다.
      Given Eth balance of Depositor was 100 // 유저가 LEth 100개를 보유하고 있다.
      And Time passes // 시간이 지난다.
      When Depositor check LEth balacne // 유저가 LEth 잔고를 확인한다.
      Then LEth balance increases by 101 //LEth 잔고가 101개로 증가한다.

   Scenario: Withdraw moneypool deposit // 머니풀 투자를 회수한다
      Given LEth balance of Depositor was 101 // 유저가 LEth 101개를 보유하고 있다.
      When Depositor withdraws 101eth from Moneypool // 유저가 LEth 101를 머니풀로부터 회수한다.
      Then Underlying 101eth is send to Depositor // 101eth가 유저에게 전송된다.
      And 101 Leth is burned from Depositor // 101Leth 가 소각된다.

   Scenario: Withdraw moneypool deposit without LToken// 머니풀 투자금이 부족하지만 회수한다.
      Given LToken balance of Depositor is 0 // 유저가 LEth 0개를 보유하고 있다.
      When Depositor withdraws 100eth from Moneypool // 유저가 LEth 100개를 머니풀에 회수한다.
      Then Withdraw is rejected due to "Not enough LToken Balance" // 회수 트랜잭션이 실행되지 않는다.

   Depositor deposits in ABToken
   Background: ABToken state
      Given Amount that can be deposited in ABToken should be enough // ABToken에 투자할 수 있는 금액이 충분하다
      And ABToken should not be matured // ABToken은 만기되지 않았다.
   Background: Moneypool configuration
      Given Eth moneypool should not be paused // Eth 머니풀은 pause가 아니다.
   # Assuming that 1 Atoken = 1Dai // 1개의 AToken = 1다이 라고 간주

   Scenario: Deposit ABToken // ABToken에 투자한다.
      Given Dai balance of Depositor was 100 // 유저가 100dai를 보유하고 있다.
      And Depositor selected ABToken to deposit // 투자할 ABToken을 선택했다.
      When Depositor deposits 100dai to ABToken // ABToken에 100dai를 투자한다.
      Then 100AToken of selected ABToken is minted to Depositor // 선택한 ABToken에 대한 100AToken이 유저에게 발행된다.
      And 100dai is transfered to Moneypool from Depositor // 100dai가 유저에서 머니풀로 전송된다.
      And Amount that can be deposited in ABToken reduces by 100 dai// ABToken에 투자할 수 있는 금액이 100dai 줄어든다

   Scenario: Refund AToken // AToken을 환매한다.
      Given AToken balance of Depositor was 100 // 유저가 100 AToken을 보유하고 있다.
      When Depositor refund 100 AToken // 유저가 100 AToken을 환매한다.
      Then 100 dai is transferred to Depositor from Moneypool // 100dai가 머니풀에서 유저로 전송된다.
      And Amount that can be deposited in ABToken increases by 100 dai// ABToken에 투자할 수 있는 금액이 100dai 증가한다

   Scenario: Interest accrued  // 이자가 누적된다.
      Given AToken balance of Depositor was 100 // 유저가 AToken을 보유하고 있다.
      And Time passed // 시간이 지났다.
      When Depositor check accrued interest // 유저가 누적된 이자를 확인한다.
      Then // 누적된 이자를 확인할 수 있다.

   Scenario: Claim interest // 이자를 찾아간다.
      Given Depositor had AToken interest accrued, 10eth // 유저에게 보유중인 누적된 AToken 이자가 있다.
      When Depositor claim accrued interest // 유저가 이자를 찾아간다.
      Then 10eth is send to Depositor from Moneypool // 유저에게 누적된 이자인 10eth가 전송된다.

   Scenario: Claim interest after maturation // 만기 이후 이자를 찾아간다.
      Given Depositor had AToken interest accrued, 10eth // 유저에게 보유중인 누적된 AToken 이자가 있다.
      And AToken balance of Depositor was 100 // 유저가 AToken 100개를 보유하고 있다.
      And ABToken corresponding AToken was matured
      When Depositor claim accrued interest // 유저가 이자를 찾아간다.
      Then 10eth is send to Depositor from Moneypool // 유저에게 누적된 이자인 10eth가 전송된다.
      And 100 AToken is burned // AToken 100개가 소각된다
      Then 100 dai is transferred to Depositor from Moneypool // 100dai가 머니풀에서 유저로 전송된다.
