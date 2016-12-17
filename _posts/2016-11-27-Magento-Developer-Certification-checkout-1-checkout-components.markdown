---
layout: post
title:  Magento Developer Certification Checkout and Checkout components
date:   2016-11-27 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Checkout and Checkout components`.

8 - Checkout
============

Checkout components
-------------------

### Describe how to modify and effectively customize the quote object, the quote item object, and the address object:

#### What is the quote model used for in Magento?

It stores the order information before the order is placed.

* Customer information
* Items
* Billing Address
* Shipping Address
* Shipping Method
* Payment Method
* Price Totals

#### What is the shopping cart model used for in Magento?

The shopping cart model update the items in a quote.

* Adding
* Removing
* Updating

#### How does Magento store information about the shopping cart?

* `sales_flat_quote`
* `sales_flat_quote_{type}`
	* `sales_flat_quote_address`
	* `sales_flat_quote_address_item`
	* `sales_flat_quote_item`
	* `sales_flat_quote_item_option`
	* `sales_flat_quote_payment`
	* `sales_flat_quote_shipping_rate`

#### How are different product types processed when added to the cart?

#### What is the difference between shipping and billing address objects in Magento? How is each used in the quote object?

Both are stored `in sales_flat_quote_address`. The difference is the column`address_type`. It will have billing or shipping as a value depending on what type of address it is.

The shipping address is used for products that have to be shipped. For product types virtual or downloadable billing address is used.

#### What is the difference in processing quote items for onepage and multishipping checkout in Magento?

#### How does Magento process additional information about products being added to the shopping cart (custom options, components of configurable products, etc.)?

#### How do products in the shopping cart affect the checkout process?

#### How can the billing and shipping addresses affect the checkout process?

#### When exactly does inventory decrementing occur?

#### When exactly does card authorization and capturing occur?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Sales_Model_Quote][Mage_Sales_Model_Quote]
* [Mage_Sales_Model_Quote_Address][Mage_Sales_Model_Quote_Address]
* [Mage_Sales_Model_Quote_Item][Mage_Sales_Model_Quote_Item]
* [Mage_Sales_Model_Quote_Address_Item][Mage_Sales_Model_Quote_Address_Item]
* [Mage/CatalogInventory/etc/config.xml][Mage/CatalogInventory/etc/config.xml]
* [Mage_CatalogInventory_Model_Observer][Mage_CatalogInventory_Model_Observer]

### Explain the database schema for total models:

#### What are total models responsible for in Magento?

#### How you can customize total models?

#### How can the individual total models be identified for a given checkout process?

#### How can the priority of total model execution be customized?

#### To which objects do total models have access in Magento, and which objects do they usually manipulate?

#### Which class runs total models processing?

#### What is the flow of total model execution?

#### At which moment(s) are total models executed

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage/Sales/etc/config.xml][Mage/Sales/etc/config.xml]
* [Mage/Tax/etc/config.xml][Mage/Tax/etc/config.xml]
* [Mage_Sales_Model_Quote_Address][Mage_Sales_Model_Quote_Address]
* [Mage_Sales_Model_Quote_Address_Item][Mage_Sales_Model_Quote_Address_Item]
* [Mage_Sales_Model_Quote_Address_Total_Abstract][Mage_Sales_Model_Quote_Address_Total_Abstract]
* [Mage_Sales_Model_Quote_Address_Total_Collector][Mage_Sales_Model_Quote_Address_Total_Collector]
* [Mage/Sales/Model/Quote/Address/Total/*][Mage/Sales/Model/Quote/Address/Total/]
* [Mage/SalesRule/etc/config.xml][Mage/SalesRule/etc/config.xml]
* [Mage_SalesRule_Model_Validator][Mage_SalesRule_Model_Validator]

#### Additional Readings

* [Magecert: Checkout][magecert.checkout]
* [Nathan McBride: Checkout Components][brideo.checkout-components]



[magecert.checkout]:http://magecert.com/checkout.html
[brideo.checkout-components]:http://brideo.co.uk/magento-certification-notes/checkout/checkout-components/Checkout-Components/




[Mage/CatalogInventory/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogInventory/etc/config.xml
[Mage_CatalogInventory_Model_Observer]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/CatalogInventory/Model/Observer.php
[Mage/Sales/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/etc/config.xml
[Mage/Tax/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Tax/etc/config.xml
[Mage_Sales_Model_Quote]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote.php
[Mage_Sales_Model_Quote_Address]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote/Address.php
[Mage_Sales_Model_Quote_Address_Item]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote/Address/Item.php
[Mage_Sales_Model_Quote_Address_Total_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote/Address/Total/Abstract.php
[Mage_Sales_Model_Quote_Address_Total_Collector]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote/Address/Total/Collector.php
[Mage/Sales/Model/Quote/Address/Total/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Sales/Model/Quote/Address/Total
[Mage_Sales_Model_Quote_Item]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote/Item.php
[Mage/SalesRule/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/SalesRule/etc/config.xml
[Mage_SalesRule_Model_Validator]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/SalesRule/Model/Validator.php
