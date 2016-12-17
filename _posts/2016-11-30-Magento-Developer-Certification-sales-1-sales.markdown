---
layout: post
title:  Magento Developer Certification Sales and Customers (Sales)
date:   2016-11-30 15:00:00
categories: Magento
---

Notes about `Magento Developer Certification Sales and Customers (Sales)`.

9 - Sales and Customers
=======================

Sales
-------------------

### Describe order creation in the admin

* Sales > Orders > Create New Order
* Create Customer/Select Customer
* Add Products
* Select Products
* Add Selected Product(s) to order
* Select Payment Method
* Get shipping methods and rates
* Select Shipping Method
* Submit Order

### Describe the differences in order creation between the frontend and the admin:

#### Which classes are involved in order creation in the admin? What are their roles (especially the role of adminhtml classes)?

* [Mage_Adminhtml_Order_CreateController][Mage_Adminhtml_controllers_Order_CreateController]
* [Mage_Adminhtml_Model_Sales_Order_Create][Mage_Adminhtml_Model_Sales_Order_Create]

#### How does Magento calculate price when an order is created from the admin?

* [Mage_Adminhtml_controllers_Order_CreateController][Mage_Adminhtml_controllers_Order_CreateController]
* [Mage_Adminhtml_Model_Sales_Order_Create][Mage_Adminhtml_Model_Sales_Order_Create]
* [Mage_Sales_Model_Quote][Mage_Sales_Model_Quote]

#### Which steps are necessary in order to create an order from the admin?

* Sales > Orders > Create New Order
* Create Customer/Select Customer
* Add Products
* Select Products
* Add Selected Product(s) to order
* Select Payment Method
* Get shipping methods and rates
* Select Shipping Method
* Submit Order

#### What happens when existing orders are edited in the admin?

The order will be canceled and a new one will be created instead. The old order will get the state `canceled`. The new order will get the state `new`. The new order will get a new increment ID. This id is the old increment id + underscore and the number of revisions made.

Example, if an order with the increment id `100002424` is edited the original order is `canceled`. A new order is created with the increment id `100002424-1` and status `new`. If the order is edited again
`100002424-1` will also be `canceled` and a new order with the increment id `100002424-2` is created.

`sales_flat_order`

| entity_id | state    | status   | increment_id | original_increment_id | relation_child_id | relation_child_real_id | relation_parent_real_id |
|----------------------|----------|--------------|-----------------------|-------------------|------------------------|-------------------------|
| 1         | canceled | canceled | 100002424    | NULL                  | 2                 | 100002424-1            | NULL                    |
| 2         | canceled | canceled | 100002424-1  | 100002424             | 3                 | 100002424-2            | 100002424               |
| 3         | new      | pending  | 100002424-2  | 100002424             | NULL              | NULL                   | 100002424-1             |


#### What is the difference between order status and order state?

The order states is used by magento to know what state the order is in. The states are defined in the class [Mage_Sales_Model_Order][Mage_Sales_Model_Order].

{% highlight php %}
`<?php
/**
 * Order states
 */
 const STATE_NEW             = 'new';
 const STATE_PENDING_PAYMENT = 'pending_payment';
 const STATE_PROCESSING      = 'processing';
 const STATE_COMPLETE        = 'complete';
 const STATE_CLOSED          = 'closed';
 const STATE_CANCELED        = 'canceled';
 const STATE_HOLDED          = 'holded';
 const STATE_PAYMENT_REVIEW  = 'payment_review';`
 {% endhighlight %}

A status is mapped to a state. It is the status that is displayed in the Magento admin. We can add a new status if we go to `System > Order Statuses > Create New Status`. One state can have several statuses mapped to it. A status can only be mapped to one state.

The table `sales_order_status` contain the statuses and their lables.

| status                   | label                    |
|--------------------------|--------------------------|
| canceled                 | Canceled                 |
| closed                   | Closed                   |
| complete                 | Complete                 |
| fraud                    | Suspected Fraud          |
| holded                   | On Hold                  |
| payment_review           | Payment Review           |
| paypal_canceled_reversal | PayPal Canceled Reversal |
| paypal_reversed          | PayPal Reversed          |
| pending                  | Pending                  |
| pending_payment          | Pending Payment          |
| pending_paypal           | Pending PayPal           |
| processing               | Processing               |

The table `sales_order_status_state` contain what state a status have.

|status           | state           | is_default |
|-----------------|-----------------|------------|
| canceled        | canceled        | 1          |
| closed          | closed          | 1          |
| complete        | complete        | 1          |
| fraud           | payment_review  | 0          |
| holded          | holded          | 1          |
| payment_review  | payment_review  | 1          |
| pending         | new             | 1          |
| pending_payment | pending_payment | 1          |
| processing      | processing      | 1          |


#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Sales_Model_Order][Mage_Sales_Model_Order]
* [Mage_Sales_Model_Order_Address][Mage_Sales_Model_Order_Address]
* [Mage_Adminhtml_controllers_Order_CreateController][Mage_Adminhtml_controllers_Order_CreateController]
* [Mage_Adminhtml_Model_Sales_Order_Create][Mage_Adminhtml_Model_Sales_Order_Create]

### Card operations (capturing and authorization):

#### Which classes and methods are responsible for credit card operations (for example authorization or capturing)?

#### What is the difference between “pay” and “capture” operations?

* Capture captures the payment online.
* Pay updates the invoice totals and change the state to paid.

#### What are the roles of the order, order_payment, invoice, and payment methods in the process of charging a card?

#### What are the roles of the total models in the context of the invoice object?

This calculate the total of the invoice.

#### How does Magento store information about invoices?

* `sales_flat_invoice contain` invoice information.
* `sales_flat_invoice_comments` contain the comments for the invoice
* `sales_flat_invoice_grid` contain totals, state and billing name.
* `sales_flat_invoice_item` the products associated with the invoice.

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Sales_Model_Order_Invoice][Mage_Sales_Model_Order_Invoice]
* [Mage/Sales/Model/Order/Invoice/*][Mage/Sales/Model/Order/Invoice/]
* [Mage_Sales_Model_Order_Payment][Mage_Sales_Model_Order_Payment]
* [Mage_Payment_Model_Method_Info][Mage_Payment_Model_Method_Info]
* [Mage_Payment_Model_Method_Abstract][Mage_Payment_Model_Method_Abstract]

### Describe the order shipment structure and process:

#### How shipment templates be customized?

#### How can different items from a single order be shipped to multiple addresses? Is it possible at all?

#### How does Magento store shipping and tracking information?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Sales_Model_Order_Shipment][Mage_Sales_Model_Order_Shipment]
* [Mage/Sales/Model/Order/Shipment/*][Mage/Sales/Model/Order/Shipment/]

### Describe the architecture and processing of refunds:

#### Which classes are involved, and which tables are used to store refund information?

#### How does Magento process taxes when refunding an order?

#### How does Magento process shipping fees when refunding an order?

#### What is the difference between online and offline refunding?

#### What is the role of the credit memo total models in Magento?

#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Sales_Model_Order_Creditmemo][Mage_Sales_Model_Order_Creditmemo]
* [Mage/Sales/Model/Order/Creditmemo/*][Mage/Sales/Model/Order/Creditmemo/]

### Describe the implementation of the three partial order operations (partial invoice, partial shipping, and partial refund):

#### How do partial order operations affect order state?

#### How is data for partial operations stored?


#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Sales_Model_Order_Invoice][Mage_Sales_Model_Order_Invoice]
* [Mage_Sales_Model_Order_Payment][Mage_Sales_Model_Order_Payment]
* [Mage_Sales_Model_Order_Shipment][Mage_Sales_Model_Order_Shipment]
* [Mage_Sales_Model_Order_Creditmemo][Mage_Sales_Model_Order_Creditmemo]
* [Mage_Payment_Model_Method_Abstract][Mage_Payment_Model_Method_Abstract]


### Describe cancel operations:

#### What cancel operations are available for the various order entities in Magento (order, order item, shipment, invoice, credit memo)? Do all of them support cancellation?

#### How are taxes processed during cancel operations?


#### These code references can be used as an entry point to find answers to the questions above:

* [Mage_Adminhtml_Sales_OrderController][Mage_Adminhtml_Sales_OrderController]
* [Mage_Sales_Model_Order_Invoice][Mage_Sales_Model_Order_Invoice]
* [Mage_Sales_Model_Order_Payment][Mage_Sales_Model_Order_Payment]
* [Mage_Sales_Model_Order_Shipment][Mage_Sales_Model_Order_Shipment]
* [Mage_Sales_Model_Order_Creditmemo][Mage_Sales_Model_Order_Creditmemo]



#### Additional Readings

[Nathan McBride: Sales][brideo.sales]


[brideo.sales]:http://brideo.co.uk/magento-certification-notes/request-flow/Sales/






[Mage_Adminhtml_controllers_Order_CreateController]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/controllers/Sales/Order/CreateController.php

[Mage_Adminhtml_Model_Sales_Order_Create]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/Model/Sales/Order/Create.php

[Mage_Adminhtml_Sales_OrderController]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Adminhtml/controllers/Sales/OrderController.php

[Mage_Sales_Model_Order]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order.php

[Mage_Sales_Model_Order_Address]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order/Address.php

[Mage_Sales_Model_Order_Creditmemo]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order/Creditmemo.php

[Mage/Sales/Model/Order/Creditmemo/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Sales/Model/Order/Creditmemo

[Mage_Sales_Model_Order_Invoice]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order/Invoice.php

[Mage/Sales/Model/Order/Invoice/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Sales/Model/Order/Invoice

[Mage_Sales_Model_Order_Payment]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order/Payment.php

[Mage_Sales_Model_Order_Shipment]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Order/Shipment.php

[Mage/Sales/Model/Order/Shipment/]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Sales/Model/Order/Shipment

[Mage_Sales_Model_Quote]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Sales/Model/Quote.php

[Mage_Payment_Model_Method_Info]:https://github.com/AndersWik/Magento-1x/tree/master/app/code/core/Mage/Payment/Model/Method

[Mage_Payment_Model_Method_Abstract]:https://github.com/AndersWik/Magento-1x/blob/master/app/code/core/Mage/Payment/Model/Method/Abstract.php
