---
layout: post
title:  Magento Developer Certification Checkout and Magento multishipping implementation
date:   2016-11-27 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Checkout and Magento multishipping implementation`.

8 - Checkout
============

Magento multishipping implementation
------------

### Describe how to extend the Magento multishipping implementation

### Identify limitations of the multishipping implementation:

#### How does the storage of quotes for multishipping and onepage checkouts differ?

#### Which quotes in a multishipping checkout flow will be virtual?

#### What is the difference in the multishipping processing for a quote with virtual products in it?

#### How can different product types be split among multiple addresses when using multishipping in Magento?

#### How many times are total models executed on a multishipping checkout in Magento?

#### Which model is responsible for multishipping checkout in Magento?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Checkout_Model_Type_Multishipping][Mage_Checkout_Model_Type_Multishipping]
* [Mage_Sales_Model_Quote_Address][Mage_Sales_Model_Quote_Address]
* [Mage_Sales_Model_Quote][Mage_Sales_Model_Quote]

#### Additional Readings


[Mage_Checkout_Model_Type_Multishipping]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Checkout/Model/Type/Multishipping.php
[Mage_Sales_Model_Quote_Address]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote/Address.php
[Mage_Sales_Model_Quote]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote.php
