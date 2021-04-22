Feature: Liquidator liquidates collateral

    Liquidator liquidates Borrower's loan
    Background: Liquidator state
        Given Dai Balance of Liquidator is enough for liquidation

    Scenario: Liquidator liqudates Borrower health factor under 1 // 청산 참여자는 Health factor가 1 이상 이하인 차입자에 대해 청산을 집행한다.
        Given Health factor of Borrower was under 1 // 유저의 Health factor는 1 이하다.
        And DEth balance of Borrower was 10 // 유저가 DEth 10개를 보유하고 있다.
        And LDai balacne of Borrower was 1000 // 유저는 LDai 1000개를 보유하고 있다.
        And Eth/Dai exchange rate is 100 // Eth/Dai 교환비율은 100이다.
        And Maximum amount of possible liquidatable debt balance is 5Deth  // 차입자의 최대 청산액은 5eth이다.
        When Liquidator liquidates Borrower's loan // 청산 참여자는 청산을 집행한다
        Then Liquidator repays 5Eth // 차입자의
        And 5Eth is send to moneypool from Liquidator // 5eth가 청산 참여자로부터 머니풀로 이동한다.
        And Health factor of Borrower increases

    Scenario: Liquidator liqudates Borrower health factor over 1 // 청산 참여자는 Health factor가 1 이상인 차입자에 대해 청산을 집행한다.
        Given Health factor of Borrower was under 1 // 유저의 Health factor는 1 이하다.
        When Liquidator liquidates Borrower's loan // 청산 참여자는 청산을 집행한다
        Then Liquidation is rejected due to "Health factor over 1"

