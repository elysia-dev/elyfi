## Testnet

#### Moneypool

```
testnet:deposit
# optional
--txSender
--amount

testnet:withdraw
# optional
--txSender
--amount

testnet:borrow
# required
--bond
(nonce, less than 10000)

testnet:repay
# optional
--txSender
# required
--bond
(nonce, less than 10000)
```

#### Tokenizer

```
testnet:createSignedAssetBond
# required
--bond
(nonce, less than 10000)
# optional
--txSender
--loanStart
(loan start date, 0000-00-00)
--amount

testnet:settleAssetBond
# required
--bond
(nonce, less than 10000)

testnet:signAssetBond
# required
--bond
(nonce, less than 10000)
```

#### Underlying Asset

```
testnet:approve
# required
--from
--to
# optional
--amount

testnet:transfer
# required
--from
--to
# optional
--amount
```

## Local

#### Moneypool

```

local:deposit
# optional
--amount

local:withdraw
# optional
--txSender
--amount

local:borrow
# In the local env, there's no need for creating asset bond
# required
--bond
(nonce, less than 10000)

local:repay
# required
--bond
(nonce, less than 10000)

```

#### Underlying Asset

```
local:approve
# required
--from
--to
# optional
--amount

local:transfer
# required
--from
--to
# optional
--amount
```
