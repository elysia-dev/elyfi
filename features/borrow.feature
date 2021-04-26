Feature: Borrower invests in ELYFI

    Borrower invest in moneypool directly
    Borrower borrow against LToken
    Background: Moneypool configuration
        Given Eth moneypool should not be paused // Eth 머니풀은 pause가 아니다.

    Background: User validation
        Given Borrower should invest Dai and hold corresponding LTokens // 유저는 dai를 투자했고, 해당하는 LToken을 보유중이다.
        And Health factor of Borrower shoule be over 1 // 유저의 Health factor는 1 이상이다.

    Background: Update Reserve state
        Given Indexes of should be updated before every borrowing // 대출이 발생하기 전에 Indexes가 업데이트 되어야 한다.
        And Interest Rate should be updated after every borrowing // 대출이 발생한 후에 Interest Rate가 업데이트 되어야 한다.

    Scenario: Borrow against LToken // 머니풀로부터 가상자산을 담보로 대출받는다
        Given Borrower selected eth out of other cryptocurrencies to borrow // 여러 가지 자산 중 빌릴 가상자산으로 eth를 선택한다.
        When Borrower borrows 100 eth // 유저는 100eth를 대출받는다.
        Then 100 eth is sent to Borrower // eth 100개가 유저에게 전송된다.
        And 100 DEth is sent to Borrower // DEth 100개가 유저에게 전송된다.
        And Health Factor of Borrower increases // 유저의 Health factor가 증가한다

    Scenario: Borrow against LToken when Health factor is under 1 // Health Factor가 1 이하일 때 머니풀로부터 가상자산을 담보로 대출받는다
        Given Borrower selected eth out of other cryptocurrencies to borrow // 여러 가지 자산 중 빌릴 가상자산으로 eth를 선택한다.
        And Health factor of Borrower was under 1 // 유저의 Health factor는 1 이하다.
        When Borrower borrows 100 eth // 유저는 100eth를 대출받는다.
        Then Borrow is rejected due to "Health factor Under 1" // 대출 트랜잭션이 실행되지 않는다.

    Scenario: Increasing Debt token balance // 유저의 Debt token이 증가한다.
        Given DEth balance of Borrower was 100 // 유저가 DEth 100개를 보유하고 있다.
        And Time passes // 시간이 지난다.
        When Borrower check DEth balance // 유저가 DEth 잔고를 확인한다.
        Then DEth balance increases by 101 //DEth 잔고가 101개로 증가한다.
        And Health Factor of Borrower increases // 유저의 Health factor가 증가한다

    Scenario: Repay Borrow // 대출을 상환한다
        Given DEth balance of Borrower was 101 // 유저가 DEth 101개를 보유하고 있다.
        When Borrower repays 101Deth // 유저가 DEth 101을 상환한다
        Then 101eth is send to Moneypool from Borrower // 101eth가 유저에서 머니풀로 전송된다.
        And 101 Deth is burned from Borrower // 101Deth 가 소각된다.
        And Health Factor of Borrower decreases // 유저의 Health factor가 감소한다

    @Todo1
    Borrower borrow against real asset
    Background: ABToken state
        Given ABToken should be loanable state // ABToken은 대출가능한 상태여야 한다.

    Background: Moneypool configuration
        Given Moneypool should not be paused // 머니풀은 pause가 아니다.
        And Dai liquidity should be enough // 머니풀의 유동성이 충분해야 한다.
    # Assuming that 1 Atoken = 1Dai // 1개의 AToken = 1다이 라고 간주

    Rule: 


    @Todo2
    Scenario: Borrow against ABToken // ABToken을 담보로 대출받는다
        Given Co deposited ABToken valued at 10000dai in Moneypool // 차입자는 10000dai의 감정평가액을 받는 ABToken을 머니풀에 예치했다.
        And Current interest rate of borrowing against ABToken is 10% // 현재 이자율은 10%이다.
        And LTV of ABToken is 80% // ABToken 의 LTV는 80%이다.
        When Co borrows 8000 dai // 유저는 8000dai를 대출받는다.
        Then 7200dai which is excluded 800 dai of future interest is transferred to Co from Moneypool // 800dai의 선이자를 제외한 7200dai가 머니풀로부터 유저에게 전송된다.
        And ABToken is transferred to MoneyPool from Co

    Scenario: Repay borrow // 대출을 상환한다.
        Given Co borrowed against ABToken // 유저는 ABToken을 담보로 8000dai를 대출받았다.
        When Co repays 7200dai
        Then 7200dai is transfered to Moneypool from Co // 7200dai가 법인에서 머니풀로 전송된다.
        And ABToken is transferred to MoneyPool from Co
