Feature: Borrower deposits in ELYFI

    Borrower deposit in moneypool directly
    Borrower borrow against LToken
    Background: Moneypool configuration
        Given Eth moneypool should not be paused

    Background: User validation
        Given Borrower should deposit Dai and hold corresponding LTokens

    Background: Update Reserve state
        Given Indexes of should be updated before every borrowing
        And Interest Rate should be updated after every borrowing

    Scenario: Borrow against LToken
        Given Borrower selected eth out of other cryptocurrencies to borrow
        When Borrower borrows 100 eth
        Then 100 eth is sent to Borrower
        And 100 DEth is sent to Borrower
        And Health Factor of Borrower increases

    Scenario: Borrow against LToken when Health factor is under 1
        Given Borrower selected eth out of other cryptocurrencies to borrow
        And Health factor of Borrower was under 1
        When Borrower borrows 100 eth
        Then Borrow is rejected due to "Health factor Under 1"

    Scenario: Increasing Debt token balance
        Given DEth balance of Borrower was 100
        And Time passes
        When Borrower check DEth balance
        Then DEth balance increases by 101
        And Health Factor of Borrower increases

    Scenario: Repay Borrow
        Given DEth balance of Borrower was 101
        When Borrower repays 101Deth
        Then 101eth is send to Moneypool from Borrower
        And 101 Deth is burned from Borrower
        And Health Factor of Borrower decreases

    Borrower borrow against real asset
    Background: ABToken state
        Given ABToken should be loanable state

    Background: Moneypool configuration
        Given Moneypool should not be paused
        And Dai liquidity should be enough
    # Assuming that 1 Atoken = 1Dai

    Rule:


        @Todo2
        Scenario: Borrow against ABToken
            Given Collateral service provider deposited ABToken valued at 10000dai in Moneypool
            And Current interest rate of borrowing against ABToken is 10%
            And LTV of ABToken is 80%
            When Collateral service provider borrows 8000 dai
            Then 7200dai which is excluded 800 dai of future interest is transferred to Collateral service provider from Moneypool
            And ABToken is transferred to MoneyPool from Collateral service provider

        Scenario: Repay borrow
            Given Collateral service provider borrowed against ABToken
            When Collateral service provider repays 7200dai
            Then 7200dai is transfered to Moneypool from Collateral service provider
            And ABToken is transferred to MoneyPool from Collateral service provider
