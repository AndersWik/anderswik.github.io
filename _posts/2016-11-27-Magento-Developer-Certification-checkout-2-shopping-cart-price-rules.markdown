---
layout: post
title:  Magento Developer Certification Checkout and Shopping Cart price rules
date:   2016-11-27 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Checkout and Shopping Cart price rules`.

8 - Checkout
============

Shopping Cart price rules
------------

### Describe how shopping cart price rules work and how they can be customized:

* Shopping Cart Price Rules are implemented in `Mage_SalesRule`
* Price
* Group Price: We can select a price for a specific customer group.
* Tier Price: This is used to give a discount to a product if the customer buys more than a set quantity. We can also select a customer group it will apply to.
* Special Price: This is a custom price we can add. We can use the "Special Price From Date" and "Special Price To Date" to limit the time that special price will apply.

#### Which module is responsible for shopping cart price rules?

`Mage_SalesRule` is responsible for shopping cart price rules.

#### What is the difference between shopping cart and catalog price rules?

Shopping cart price rules only apply to products in the cart. This can be a discount if "Row total in cart" is above a set value. Catalog price rules apply to the catalog (category view/product view). The customer do no need to add the product to cart to see the discount.

#### What are the limitations of Magento shopping cart rules?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage/SalesRule/etc/config.xml][Mage/SalesRule/etc/config.xml]
* [Mage/SalesRule/Model/*][Mage/SalesRule/Model/]

#### Additional Readings

[Nathan McBride: Shopping Cart price rules][brideo.shopping-cart-price-rules]



[brideo.shopping-cart-price-rules]:http://brideo.co.uk/magento-certification-notes/checkout/checkout-components/Shopping-Cart-Price-Rules/
[magento.product-prices]:http://docs.magento.com/m1/ce/user_guide/catalog/product-prices.html
[magento.price-rules-shopping-cart]:http://docs.magento.com/m1/ce/user_guide/marketing/price-rules-shopping-cart.html



[Mage/SalesRule/etc/config.xml]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/SalesRule/etc/config.xml
[Mage/SalesRule/Model/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/SalesRule/Model
