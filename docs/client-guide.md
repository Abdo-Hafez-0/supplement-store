# Supplement Store: client guide

This guide shows you how to run the store from the admin dashboard and what shoppers see.
It's updated each time a new part of the store is delivered. The **What's new** section at
the end lists every update.

- **Store:** https://supplement-store.abdohafez731.workers.dev
- **Admin dashboard:** https://supplement-store.abdohafez731.workers.dev/admin

> **This is the prototype.** It now uses the DRIVEX logo and brand colors (deep green and
> gold). Your own domain comes after you approve it. The checkout page is ready, but
> payments aren't switched on yet, so nobody can place a real order. PayPal, card, Google Pay
> and order emails arrive in the next update.

---

## 1. Signing in

1. Open the **admin dashboard** link above.
2. Enter your email and password, then select **Sign in**.

Your login details are sent to you separately. For security, sign-in is locked for 5 minutes
after 5 wrong attempts from the same connection. Wait and try again if you see
"Too many attempts".

Select **Sign out** at the top right when you're done, especially on a shared computer.

The menu at the top has five sections: **Overview**, **Orders**, **Products**, **Shipping**
and **Settings**.

---

## 2. Getting started: recommended order

Some things depend on others, so set up the store in this order:

1. **Gift products first.** A free gift is just another product. Add each gift and its
   substitute as a product with status **Unlisted** (see 3.1), so tiers can offer them.
2. **Your products**, with images, then their **tiers and gifts**, **order bump** and
   **review images**.
3. At least one **shipping method**.
4. **Settings:** home page text, banners, timer, how-to video.

The **Overview** page shows how many orders are waiting to be shipped (**Orders to ship**),
how many products are Active, Unlisted and Draft, and how many shipping methods are active.

---

## 3. Products

Go to **Products**. The list shows each product's image, status, regular price, stock (shown
in red at 0) and number of tiers. Select a product to edit it, or **Add product** to create
one.

### 3.1 Product details

| Field | What it does |
| --- | --- |
| **Title** | The product name shoppers see. |
| **URL slug** | The end of the product's web address, e.g. `/products/daily-multivitamin`. It fills in from the title; change it only if needed. Each product needs a different slug. |
| **Short description** | One or two sentences under the title on the product page and on product cards. |
| **Description** | The full text further down the product page. Leave a blank line between paragraphs. |
| **Regular price ($)** | The normal price for one bottle. Shoppers see it **struck through** next to the bundle prices. It's also the price when a product has no tiers. Type it like `49.99`. |
| **Stock (bottles)** | How many you have. Shoppers can't add more than this to the cart. At 0 the product shows "Out of stock". |
| **Status** | **Active**: shown in the store and can be bought. **Unlisted**: can be bought through its link and used as a gift or order bump, but isn't shown in the product list (use this for gift products). **Draft**: hidden and can't be bought (use this while preparing a product, or to take one off sale). |
| **Sort order** | Lower numbers show first in lists. |
| **Feature on the home page** | Shows the product in the home page's "Featured" section. |

Select **Create product** (or **Save product**) to save. After creating a product, its edit
page opens so you can add tiers, gifts, the order bump and review images.

### 3.2 Product images

- Select **Upload images** and pick one or more photos (JPEG, PNG or WebP, up to 25 MB each).
- Photos are **resized automatically** while uploading, so shoppers' phones load them quickly.
  You don't need to shrink them first.
- The **first image is the main image** on cards and the product page. Use the **← →**
  buttons to reorder and **Remove** to take one out.
- Up to 10 images per product.
- **Important:** image changes are kept only when you select **Save product**.

### 3.3 Tiers and gifts

Tiers are the bundle choices on the product page, e.g. "1 bottle / 2 bottles / 3 bottles".
A product with no tiers is sold at its regular price.

Select **Add tier** for each bundle. For each tier:

| Field | What it does |
| --- | --- |
| **Bottles** | How many bottles the bundle contains. Each tier needs a different number. |
| **Bundle price ($)** | The price for **all** the bottles together, e.g. `99.00` for 3 bottles. Below the field you'll see the price per bottle and how much the shopper saves against the regular price. |
| **Badge (optional)** | A small label on the tier card, e.g. "Most popular" or "Best value". |
| **Preselected** | The tier that's selected when the page opens. Only one tier can be preselected. |
| **Includes a gift** | Tick to give a free gift with this tier. |
| **Gift product** | The free gift (must already exist as a product). |
| **Substitute if out of stock** | Optional. Given instead when the gift runs out. |
| **Gift quantity** | Leave empty for the usual rule: **bottles − 1** (2 bottles = 1 gift, 3 bottles = 2 gifts). Type a number to override it for this tier. |

Select **Save tiers** when done. **Remove tier** deletes one.

**How gifts work for shoppers**

- The gift is added to the cart automatically, as its own line under the product. Shoppers
  can't change or remove a gift on its own; it follows the product.
- If the gift is out of stock, the **substitute** is given instead.
- If both are out of stock, the tier shows no gift, and the gift badge and gift text are hidden.
- If two products give the same gift, each keeps its own gift line in the cart.
- A gift product bought on its own is charged its full price.

**How prices work in the cart:** the price always comes from the real number of bottles in
the cart, not from which card was clicked. If a shopper changes 3 bottles to 1 in the cart,
it re-prices to the 1-bottle price and the gift goes away. Above your biggest tier (e.g. 5
bottles when the top tier is 3), each bottle costs the top tier's price per bottle (rounded
to the cent), with gifts = bottles − 1.

### 3.4 Order bump

An order bump is a checkbox offer at checkout, e.g. "Yes, add a shaker bottle for $9.99".
Each product can have one.

| Field | What it does |
| --- | --- |
| **Offered product** | The product offered at checkout (a different product). |
| **Bump price ($)** | The special price for one item. It gets no tiers or gifts. |
| **Checkbox text** | The text next to the checkbox. |

Select **Save order bump**, or **Remove bump** to delete it.

Shoppers see the bump as a **checkbox offer at the bottom of the cart panel** (and in the
**Shipping method** step at checkout). Ticking it adds one of the offered product at the bump price; unticking removes it.
Only one bump shows at a time: if the cart holds several products with bumps, the bump of the
product with the highest total in the cart is shown. If that product leaves the cart, the bump
goes with it. The offer is hidden while the offered product is out of stock or set to Draft.

### 3.5 Review images

Screenshots of customer reviews, shown in a swipeable carousel on the product page.

- Select **Upload review images** (up to 15 per product).
- Add a short description to each (it helps shoppers who use screen readers). It saves
  when you click outside the field.
- Use **← →** to reorder, **Delete** to remove.

### 3.6 Deleting a product

At the bottom of a product's page, select **Delete product** and confirm. This also deletes
its tiers, gifts, order bump and review images. Past orders are never affected.

A product that's used as a gift, a substitute or an order bump somewhere else can't be
deleted. The message tells you where it's used. Change those first, or set the product to
**Draft** instead.

---

## 4. Orders

Go to **Orders**. Every order gets an order number like **DX-7K3M9QX2**; customers use it to
look up their order.

The tabs at the top filter the list:

| Tab | Shows |
| --- | --- |
| **To ship** | Paid orders that haven't been shipped yet. Start here every day. |
| **All paid** | Every paid order: to ship, shipped and refunded. |
| **Unpaid** | Checkouts where the customer didn't finish paying (no stock was taken). |
| **Everything** | All of the above. |

Select an order to open it. You'll see the items with the **price at purchase** (later price
changes never change past orders), free gifts and the order bump, the totals, the shipping
address, the customer's email and phone, and the PayPal reference.

**Shipping an order:** in the **Fulfillment** box, set **Status** to **Shipped**, type the
**Tracking number**, and select **Save**. The customer sees the status and tracking number on
their order page.

**Refunds:** make the refund in your PayPal account first, then set the order's **Status** to
**Refunded** here and select **Save**. Marking an order refunded doesn't put the bottles
back in stock; change the product's stock yourself if the bottles come back.

**Stock:** stock goes down automatically for every bottle in a paid order, including free
gifts and the order bump. Unpaid checkouts never take stock.

At the bottom of an order, **Preview the customer's confirmation email** and **Preview your
new-order alert** show the two emails as they'll look. They're sent automatically once
payments are switched on in the next update.

---

## 5. Shipping

Go to **Shipping**. Shoppers will choose from the active methods at checkout.

| Field | What it does |
| --- | --- |
| **Name** | e.g. "Standard shipping". |
| **Delivery text** | e.g. "Arrives in 3–5 business days". |
| **Price ($)** | `0` for free shipping. |
| **Free over ($)** | Optional. Shipping becomes free when the order reaches this amount. |
| **Sort order** | Lower numbers show first. |
| **Active at checkout** | Untick to hide a method without deleting it. |

Use **Add shipping method** for a new one, **Save** to update one, **Delete** to remove it.

---

## 6. Settings

Go to **Settings**. Each box has its own **Save** button.

### Home page
- **Headline** and **Intro text**: the large text at the top of the home page.
- **About title** and **About text**: the "About us" section. Leave it empty to hide it.
- **FAQ**: select **Add question** for each question and answer, then use **Move up / Move down**
  to order them. Up to 12. The FAQ also opens from the **FAQ** link in the menu.
- **Footer contacts**: email, phone, address and support hours at the bottom of every page.
  Empty fields are hidden.

### Banners and badges
- **Announcement bar**: the thin bar at the very top of every page. Empty hides it.
- **Product page promo banner**: a line at the top of product pages.
- **Promo banner gift text**: added after the promo banner, e.g. "+ free gift". It's
  automatically hidden on products whose gifts are all out of stock.
- **Gift badge**: the small label on tier cards that include a gift, e.g. "FREE GIFT".
- **Free-shipping callout**: shown on product pages and in the cart.
- **Checkout trust badges**: up to 4 short reassurances, e.g. "Secure checkout". Shown with
  a shield icon under the home page banner and under **Add to cart** on product pages, and
  at the bottom of the checkout page. Empty hides them.

### Countdown timer
- **Show the countdown timer on product pages**: turns it on or off.
- **Length (minutes)**: each visitor gets their **own** countdown, starting from their first visit.
- **When it reaches zero**:
  - **Bundle prices end, regular price applies, then restart**: after zero, that visitor sees
    regular prices for the number of hours you set in **Regular price for (hours)** (24 by
    default), then their countdown starts again.
  - **Restart the countdown right away (prices stay)**: the countdown simply starts over.
- The server enforces the timer, so changing a computer's clock doesn't extend the offer.
  Clearing the browser's cookies or switching to another browser does start a fresh countdown.
- Free gifts are still given after the countdown ends; only the bundle prices stop.

### How-to video
One video shown on **every** product page. Select **Upload video** (MP4, up to 200 MB), add a
**Section title**, then **Save**. **Replace video** swaps it, **Remove video** takes it off.

### Order notifications
**New-order notification email**: the address that gets an email for every paid order. Leave
it empty to turn the alert off. (Emails start with the next update.)

### Cart limits
**Maximum quantity per product in the cart**: leave empty for no limit.

### Live chat
**Live chat ID**: from your chat provider. The chat widget itself is connected in a later
update.

---

## 7. What shoppers see

### Look and feel
The store uses the DRIVEX logo (in the header, the footer and the browser tab icon) and two
brand colors: **deep green** for buttons, the top bar, the home banner and the footer, and
**gold** for savings, badges, free gifts and the countdown. Headings use the Poppins font
(the same style as the logo) and body text uses Inter. Pages are designed for phones first.

### Home page
Announcement bar, then a green banner with your headline and a gold **Shop all products**
button, your trust badges, **Featured** products (or your first products if none are
featured), **About us**, the **FAQ** (tap a question to open its answer), and the green
footer with your contacts and the standard supplement disclaimer.

### All products (`/products`)
Every **Active** product, with its main image, the lowest price per bottle ("From $31.66 /
bottle", with the regular price struck through) and a gold **Save up to 37%** label showing
the best bundle saving. Sold-out products show **Out of stock** instead.

### Product page
1. Promo banner in gold (and gift text when a gift is available).
2. Image gallery: swipe on phones, or tap the small images.
3. Title, short description and the regular price struck through.
4. **Countdown timer** in a green box, when switched on.
5. **Tier cards**: bundle price, price per bottle, the regular total struck through, a gold
   "Save %" label, your **Badge** (e.g. "Most popular") on the card's top edge, the gift
   badge, and which gift comes with it. The selected card is outlined in green.
6. **Gift preview** for the selected tier, in a gold box.
7. **Add to cart**, showing the price of the selected bundle, then the free-shipping callout
   and your trust badges. On phones, once shoppers scroll past the button, a bar with the
   price and **Add to cart** stays at the bottom of the screen.
8. Description, how-to video, and the review carousel (tap a review to see it full size).

### Cart
The cart icon at the top shows how many bottles are in the cart (gifts included).
Adding to cart opens the cart panel from the side, where shoppers can:
- change quantities with **− / +** (prices and gifts update right away),
- **Remove** a product (its gift goes with it),
- see each gift under its product in a gold box, marked **FREE GIFT**,
- tick the **order bump** offer to add it (see 3.4),
- see their savings and subtotal.

If something changes while a product sits in the cart, the cart corrects itself and says
so. For example: stock runs low, a product is set to Draft, or your cart limit is lower.

### Checkout (`/checkout`)
**Checkout** in the cart panel opens the checkout page. Shoppers fill in four steps:

1. **Contact**: email and phone number (both required; US phone numbers only).
2. **Shipping address**: full name, street address, apartment (optional), city, state and
   ZIP code. You ship within the United States only.
3. **Shipping method**: your active methods with their prices ("Free" when the order reaches
   the method's free-over amount), and the **order bump** checkbox offer.
4. **Payment**: **Continue to payment** checks every field and confirms the total. For now
   it then says online payment opens soon. The PayPal, card and Google Pay buttons appear
   here in the next update.

The **order summary** (items, free gifts, savings, subtotal, shipping and total) is at the top
on phones (tap it to open) and on the right on computers. Your trust badges show at the bottom.
The store prices everything again on its side, so a shopper can't change a price from their
browser.

### Order confirmation and order lookup
After paying, shoppers see a **Thank you for your order!** page with the order number, status,
items, totals and address. **Track your order** in the footer (`/orders`) lets them find an
order later with their email and order number. To protect customers' details, an order page
only opens in the browser that placed the order, or after entering the matching email.

---

## 8. Try it yourself: demo checklist

Use these to see every feature in action. Use a phone for the shopper side.

1. **Gift products:** add a gift (e.g. a shaker bottle) and a substitute (e.g. a pill
   organizer), both **Unlisted**, with some stock.
2. **A product with tiers:** add a product with images, then tiers of 1, 2 and 3 bottles.
   Give the 2- and 3-bottle tiers the gift, with the substitute. Set it to **Active** and
   **Feature on the home page**.
3. **Home page:** open the store. Your product shows under Featured.
4. **Product page:** open the product. Select each tier and watch the gift preview change.
5. **Cart:** add 3 bottles. The cart shows 2 free gifts. Press **−** down to 1 bottle: the
   price changes and the gift disappears. Press **+** up to 5: 4 gifts, priced per bottle.
6. **Substitute gift:** in the admin, set the gift's stock to 0 and save. Reload the product
   page: the substitute is offered instead. Set the substitute to 0 too: no gift, and the
   gift text disappears. Put the stock back afterwards.
7. **Timer:** in **Settings**, turn the timer on with a short length (e.g. 2 minutes), and
   watch it count down on the product page. At zero the tier prices switch to regular
   prices. Set it back to your real length afterwards.
8. **Order bump:** give your product an order bump (3.4). Add the product to the cart: the
   offer appears at the bottom of the cart panel. Tick it and the subtotal goes up by the
   bump price; untick it to remove it.
9. **Banners and FAQ:** fill in the announcement bar, promo banner and a few FAQ questions,
   and check them on the store.
10. **Checkout:** with products in the cart, select **Checkout**. Select **Continue to
    payment** with the fields empty to see the checks, then fill them in. Tick and untick the
    order bump and watch the total change. Paying arrives in the next update.

---

## 9. Coming next

- **Payments and emails:** PayPal, card and Google Pay at checkout (in test mode first; Apple
  Pay after your domain is connected), the customer's confirmation email and your new-order
  alert.
- **Finishing:** Meta Pixel tracking, live chat, speed improvements and a full test run.
- **After approval:** your own domain and live payments.

---

## What's new

| Date | Update | What was added |
| --- | --- | --- |
| 2026-10-18 | Checkout and orders (part 1) | Checkout page with contact, US address, shipping method, order bump and summary; order confirmation page; order lookup (**Track your order**); **Orders** in the admin with shipping status, tracking number and refunds; **Order notifications** setting; email previews. Payments come next. |
| 2026-10-18 | DRIVEX design | The store now uses the DRIVEX logo, green and gold colors and new fonts, with a redesigned home page, product cards, product page, cart and admin login. Trust badges now also show on the home page and product pages. On phones, an Add to cart bar stays at the bottom of product pages. |
| 2026-10-11 | Order bump in the cart | The order bump now shows as a checkbox offer in the cart panel. |
| 2026-10-11 | Cart | Add to cart, the cart panel, automatic gifts in the cart, quantity changes with live re-pricing. |
| 2026-10-11 | Storefront | Home page, product list, product page with tiers, gifts, timer, video and reviews; home page and banner settings; automatic photo resizing. |
| 2026-10-10 | Admin | Admin login, products with tiers, gifts, order bump and images, shipping methods, settings. |
| 2026-10-09 | Setup | The review site went live. |
