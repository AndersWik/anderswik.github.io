---
layout: post
title:  Magento Developer Certification Checkout and payment methods in Magento
date:   2016-11-27 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Checkout and payment methods in Magento`.

8 - Checkout
============

Shipping and payment methods in Magento
------------

### Describe the programmatic structure of shipping methods, how to customize existing methods, and how to implement new methods

### Describe the shipping rates calculation process:

#### How does Magento calculate shipping rates?

#### What is the hierarchy of shipping information in Magento?

#### How does the TableRate shipping method work?

#### How do US shipping methods (FedEX, UPS, USPS) work?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Shipping_Model_Carrier_Abstract][Mage_Shipping_Model_Carrier_Abstract]
* [Mage_Shipping_Model_Rate_Abstract][Mage_Shipping_Model_Rate_Abstract]
* [Mage_Shipping_Model_Rate_Request][Mage_Shipping_Model_Rate_Request]
* [Mage_Shipping_Model_Rate_Result][Mage_Shipping_Model_Rate_Result]
* [Mage/Shipping/Model/Rate/Result/*][Mage/Shipping/Model/Rate/Result/]
* [Mage_Shipping_Model_Info][Mage_Shipping_Model_Info]
* [Mage/Shipping/Model/Carrier/*][Mage/Shipping/Model/Carrier/]
* [Mage/Shipping/Model/Resource/Carrier/*][Mage/Shipping/Model/Resource/Carrier/]

### Describe the programmatic structure of payment methods and how to implement new methods:

#### How can payment method behavior be customized (for example: whether to charge or authorize a credit card; controlling URL redirects; etc.)?

#### Which class is the basic class in the payment method hierarchy?

#### How can the stored data of payment methods be customized (credit card numbers, for example)?

#### What is the difference between payment method and payment classes (such as order_payment, quote_payment, etc.)?

#### What is the typical structure of the payment method module?

#### How do payment modules support billing agreements?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Payment_Model_Method_Abstract][Mage_Payment_Model_Method_Abstract]
* [Mage_Payment_Model_Method_Cc][Mage_Payment_Model_Method_Cc]
* [Mage_Payment_Model_Info][Mage_Payment_Model_Info]
* [Mage/Paypal/*][Mage/Paypal/]
* [Mage/PaypalUk/*][Mage/PaypalUk/]

#### Additional Readings



[Mage_Shipping_Model_Carrier_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Shipping/Model/Carrier/Abstract.php
[Mage_Shipping_Model_Rate_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Shipping/Model/Rate/Abstract.php
[Mage_Shipping_Model_Rate_Request]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Shipping/Model/Rate/Request.php
[Mage_Shipping_Model_Rate_Result]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Shipping/Model/Rate/Result.php
[Mage/Shipping/Model/Rate/Result/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Shipping/Model/Rate/Result
[Mage_Shipping_Model_Info]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Shipping/Model/Info.php
[Mage/Shipping/Model/Carrier/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Shipping/Model/Carrier
[Mage/Shipping/Model/Resource/Carrier/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Shipping/Model/Resource/Carrier
[Mage_Payment_Model_Method_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Payment/Model/Method/Abstract.php
[Mage_Payment_Model_Method_Cc]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Payment/Model/Method/Cc.php
[Mage_Payment_Model_Info]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Payment/Model/Info.php
[Mage/Paypal/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Paypal
[Mage/PaypalUk/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/PaypalUk
