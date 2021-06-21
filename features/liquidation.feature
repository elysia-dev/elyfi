Feature: Liquidator liquidates collateral

    Liquidator liquidates Borrower's loan
    Background: Liquidator state
        Given Dai Balance of Liquidator is enough for liquidation

    Scenario: Liquidator liqudates Borrower after liquidation timestamp
        Given The currnet timestamp was greater than the liquidation timestamp
        When Liquidator liquidated Borrower's loan
        Then Liquidation was rejected due to "Health factor over 1"

