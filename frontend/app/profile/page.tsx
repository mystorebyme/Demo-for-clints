'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DemoBanner from '@/components/DemoBanner';
import { formatEthnicSizeLabel } from '@/components/ProductCard';
import { getProductPriceForSize } from '@/lib/catalog';
import { formatINR, SavedAddressItem, useStore } from '@/lib/store';

type OrderSummary = {
  order_id: string;
  invoice_number: string;
  tracking_id: string | null;
  status: string;
  fulfillment_status: string;
  amount_paise: number;
  courier_name: string;
  estimated_delivery: string | null;
  created_at: string;
  items: Array<{
    id: number;
    name: string;
    name_hi?: string;
    qty: number;
    size: string;
    price_paise: number;
    image_url: string;
  }>;
};

type WishlistProduct = {
  id: number;
  sku?: string;
  name: string;
  name_hi: string;
  price_paise: number;
  original_price_paise?: number;
  image_url: string;
  category: 'kurti' | 'bag' | 'accessory';
  fabric?: string;
  sizes?: string[];
  stock: number;
};

type MailNotification = {
  to: string;
  otpCode: string;
  subject: string;
  expiresInMinutes: number;
};

export default function ProfilePage() {
  const {
    customerProfile,
    setCustomerProfile,
    disconnectCustomerProfile,
    wishlist,
    setWishlist,
    toggleWishlist,
    addToCart,
    lang,
    hydrate,
  } = useStore();

  // Auth modes:Password Login | Passwordless OTP Login | Create Account via OTP | Forgot/Reset Password via OTP
  const [authMode, setAuthMode] = useState<'login' | 'login_otp' | 'register' | 'forgot'>('login');
  const [activeHubTab, setActiveHubTab] = useState<'orders' | 'wishlist' | 'addresses' | 'security'>('orders');

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpStepPending, setOtpStepPending] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [mailNotification, setMailNotification] = useState<MailNotification | null>(null);

  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [pincodeInput, setPincodeInput] = useState('');
  const [cityStateInput, setCityStateInput] = useState('Jaipur, Rajasthan');
  const [addressInput, setAddressInput] = useState('');

  // Address Book state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [addrLabel, setAddrLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrCityState, setAddrCityState] = useState('Jaipur, Rajasthan');
  const [addrLine, setAddrLine] = useState('');
  const [addrPinCheckMsg, setAddrPinCheckMsg] = useState('');
  const [addrPinServiceable, setAddrPinServiceable] = useState<boolean | null>(null);

  // Password Change state (inside Security tab)
  const [currentPwd, setCurrentPwd] = useState('');
  const [updatedPwd, setUpdatedPwd] = useState('');
  const [pwdStatusMsg, setPwdStatusMsg] = useState('');

  // Selected size per wishlist item
  const [wishlistSizes, setWishlistSizes] = useState<Record<number, string>>({});

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cartToast, setCartToast] = useState('');

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (customerProfile.email) {
      setEmailInput(customerProfile.email);
      setNameInput(customerProfile.name || '');
      setPhoneInput(customerProfile.phone || '');
      setPincodeInput(customerProfile.pincode || '');
      setCityStateInput(customerProfile.cityState || 'Jaipur, Rajasthan');
      setAddressInput(customerProfile.address || '');
      if (Array.isArray(customerProfile.savedAddresses)) {
        setSavedAddresses(customerProfile.savedAddresses);
      }
      if (customerProfile.sessionToken) {
        fetchAccountData(customerProfile.email, customerProfile.sessionToken);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerProfile.email, customerProfile.sessionToken]);

  async function fetchAccountData(email: string, token?: string) {
    const clean = email.trim().toLowerCase();
    const activeToken = token || customerProfile.sessionToken || '';
    if (!clean || !clean.includes('@') || !activeToken) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/account?email=${encodeURIComponent(clean)}`, {
        headers: {
          'x-account-token': activeToken,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          lang === 'hi' && data.error_hi
            ? data.error_hi
            : data.error || 'Please sign in to access your account.'
        );
        return;
      }
      setOrders(data.orders || []);
      setWishlistProducts(data.wishlistProducts || []);
      if (data.profile) {
        setNameInput((prev) => prev || data.profile.name || '');
        setPhoneInput((prev) => prev || data.profile.phone || '');
        setPincodeInput((prev) => prev || data.profile.pincode || '');
        setCityStateInput((prev) => prev || data.profile.cityState || 'Jaipur, Rajasthan');
        setAddressInput((prev) => prev || data.profile.address || '');
        if (Array.isArray(data.profile.savedAddresses)) {
          setSavedAddresses(data.profile.savedAddresses);
        }
        if (Array.isArray(data.profile.wishlist)) {
          const merged = Array.from(new Set([...wishlist, ...data.profile.wishlist]));
          setWishlist(merged);
        }
      }
    } catch {
      setErrorMsg('Unable to sync account right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function applyAuthenticatedSession(data: {
    sessionToken: string;
    profile?: {
      email?: string;
      name?: string;
      phone?: string;
      pincode?: string;
      cityState?: string;
      address?: string;
      wishlist?: number[];
      savedAddresses?: SavedAddressItem[];
    };
    orders?: OrderSummary[];
    wishlistProducts?: WishlistProduct[];
  }) {
    const cleanEmail = (data.profile?.email || emailInput).trim().toLowerCase();
    const serverWishlist: number[] = Array.isArray(data.profile?.wishlist)
      ? data.profile!.wishlist!
      : [];
    const mergedWishlist = Array.from(new Set([...wishlist, ...serverWishlist]));
    setWishlist(mergedWishlist);

    const nextAddresses: SavedAddressItem[] = Array.isArray(data.profile?.savedAddresses)
      ? data.profile!.savedAddresses!
      : [];
    setSavedAddresses(nextAddresses);

    setCustomerProfile({
      email: cleanEmail,
      name: data.profile?.name || nameInput.trim(),
      phone: data.profile?.phone || phoneInput.replace(/\D/g, '').slice(-10),
      pincode: data.profile?.pincode || pincodeInput.replace(/\D/g, '').slice(0, 6) || '302001',
      cityState: data.profile?.cityState || cityStateInput.trim() || 'Jaipur, Rajasthan',
      address: data.profile?.address || addressInput.trim(),
      savedAddresses: nextAddresses,
      sessionToken: data.sessionToken,
      emailVerified: true,
      connectedAt: new Date().toISOString(),
    });

    setNameInput(data.profile?.name || nameInput.trim());
    setPhoneInput(data.profile?.phone || phoneInput.replace(/\D/g, '').slice(-10));
    setPincodeInput(data.profile?.pincode || pincodeInput || '302001');
    setCityStateInput(data.profile?.cityState || cityStateInput || 'Jaipur, Rajasthan');
    setAddressInput(data.profile?.address || addressInput.trim());
    setOrders(data.orders || []);
    setWishlistProducts(data.wishlistProducts || []);
    setPasswordInput('');
    setNewPasswordInput('');
    setOtpInput('');
    setOtpStepPending(false);
    setOtpNotice('');
    setMailNotification(null);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);

    // If client had local wishlist items not yet saved on server, push merged wishlist
    if (mergedWishlist.length > serverWishlist.length) {
      fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-token': data.sessionToken,
        },
        body: JSON.stringify({
          action: 'save',
          email: cleanEmail,
          sessionToken: data.sessionToken,
          wishlist: mergedWishlist,
        }),
      })
        .then((r) => r.json())
        .then((resData) => {
          if (resData?.wishlistProducts) {
            setWishlistProducts(resData.wishlistProducts);
          }
        })
        .catch(() => {});
    }
  }

  async function handleConnectOrSave(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया सही ईमेल आईडी दर्ज करें (जैसे yourname@gmail.com)'
          : 'Please enter a valid email address (e.g. yourname@gmail.com)'
      );
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const isAlreadyAuthenticated =
        Boolean(customerProfile.sessionToken) &&
        customerProfile.email.toLowerCase() === cleanEmail;

      if (!isAlreadyAuthenticated) {
        // MODE 1: Standard Email + Password Sign In
        if (authMode === 'login') {
          const authRes = await fetch('/api/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'login',
              email: cleanEmail,
              password: passwordInput,
            }),
          });
          const authData = await authRes.json();
          if (!authRes.ok) {
            setErrorMsg(
              lang === 'hi' && authData.error_hi
                ? authData.error_hi
                : authData.error || 'Authentication failed'
            );
            setLoading(false);
            return;
          }
          applyAuthenticatedSession(authData);
          setLoading(false);
          return;
        }

        // MODE 2: Passwordless Email OTP Sign In (Amazon / Flipkart style)
        if (authMode === 'login_otp') {
          if (!otpStepPending) {
            const otpRes = await fetch('/api/account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'login_send_otp',
                email: cleanEmail,
              }),
            });
            const otpData = await otpRes.json();
            if (!otpRes.ok) {
              setErrorMsg(
                lang === 'hi' && otpData.error_hi
                  ? otpData.error_hi
                  : otpData.error || 'Could not send sign-in OTP.'
              );
              setLoading(false);
              return;
            }
            setOtpStepPending(true);
            setOtpNotice(
              lang === 'hi' && otpData.message_hi
                ? otpData.message_hi
                : otpData.message_en || `Sign-in OTP sent to ${cleanEmail}`
            );
            if (otpData.mailNotification) {
              setMailNotification(otpData.mailNotification);
            }
            setLoading(false);
            return;
          }

          const verifyRes = await fetch('/api/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'login_verify_otp',
              email: cleanEmail,
              otp: otpInput,
            }),
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setErrorMsg(
              lang === 'hi' && verifyData.error_hi
                ? verifyData.error_hi
                : verifyData.error || 'Invalid OTP code.'
            );
            setLoading(false);
            return;
          }
          applyAuthenticatedSession(verifyData);
          setLoading(false);
          return;
        }

        // MODE 3: Forgot Password / Reset Password via Email OTP
        if (authMode === 'forgot') {
          if (!otpStepPending) {
            const otpRes = await fetch('/api/account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'forgot_send_otp',
                email: cleanEmail,
              }),
            });
            const otpData = await otpRes.json();
            if (!otpRes.ok) {
              setErrorMsg(
                lang === 'hi' && otpData.error_hi
                  ? otpData.error_hi
                  : otpData.error || 'Could not send password reset code.'
              );
              setLoading(false);
              return;
            }
            setOtpStepPending(true);
            setOtpNotice(
              lang === 'hi' && otpData.message_hi
                ? otpData.message_hi
                : otpData.message_en || `Password reset OTP sent to ${cleanEmail}`
            );
            if (otpData.mailNotification) {
              setMailNotification(otpData.mailNotification);
            }
            setLoading(false);
            return;
          }

          const resetRes = await fetch('/api/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'forgot_verify_reset',
              email: cleanEmail,
              otp: otpInput,
              newPassword: newPasswordInput,
            }),
          });
          const resetData = await resetRes.json();
          if (!resetRes.ok) {
            setErrorMsg(
              lang === 'hi' && resetData.error_hi
                ? resetData.error_hi
                : resetData.error || 'Password reset failed.'
            );
            setLoading(false);
            return;
          }
          applyAuthenticatedSession(resetData);
          setLoading(false);
          return;
        }

        // MODE 4: Create New Account via 6-Digit Email OTP
        if (!otpStepPending) {
          const otpRes = await fetch('/api/account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'register_send_otp',
              email: cleanEmail,
              password: passwordInput,
              name: nameInput.trim(),
              phone: phoneInput.replace(/\D/g, '').slice(-10),
            }),
          });
          const otpData = await otpRes.json();
          if (!otpRes.ok) {
            setErrorMsg(
              lang === 'hi' && otpData.error_hi
                ? otpData.error_hi
                : otpData.error || 'Failed to send verification code.'
            );
            setLoading(false);
            return;
          }
          setOtpStepPending(true);
          setOtpNotice(
            lang === 'hi' && otpData.message_hi
              ? otpData.message_hi
              : otpData.message_en || `6-digit verification code sent to ${cleanEmail}`
          );
          if (otpData.mailNotification) {
            setMailNotification(otpData.mailNotification);
          }
          setLoading(false);
          return;
        }

        // Step 2 of Registration: Verify 6-digit OTP and create account
        const verifyRes = await fetch('/api/account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register_verify_otp',
            email: cleanEmail,
            otp: otpInput,
          }),
        });
        const authData = await verifyRes.json();
        if (!verifyRes.ok) {
          setErrorMsg(
            lang === 'hi' && authData.error_hi
              ? authData.error_hi
              : authData.error || 'OTP verification failed'
          );
          setLoading(false);
          return;
        }
        applyAuthenticatedSession(authData);
        setLoading(false);
        return;
      }

      // Already authenticated -> update profile details
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-token': customerProfile.sessionToken || '',
        },
        body: JSON.stringify({
          action: 'save',
          email: cleanEmail,
          sessionToken: customerProfile.sessionToken,
          name: nameInput.trim(),
          phone: phoneInput.replace(/\D/g, '').slice(-10),
          pincode: pincodeInput.replace(/\D/g, '').slice(0, 6),
          cityState: cityStateInput.trim() || 'Jaipur, Rajasthan',
          address: addressInput.trim(),
          savedAddresses,
          wishlist,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          lang === 'hi' && data.error_hi
            ? data.error_hi
            : data.error || 'Could not save account'
        );
        return;
      }

      setCustomerProfile({
        email: cleanEmail,
        name: data.profile?.name || nameInput.trim(),
        phone: data.profile?.phone || phoneInput.replace(/\D/g, '').slice(-10),
        pincode: data.profile?.pincode || pincodeInput.replace(/\D/g, '').slice(0, 6),
        cityState: data.profile?.cityState || cityStateInput.trim() || 'Jaipur, Rajasthan',
        address: data.profile?.address || addressInput.trim(),
        savedAddresses: data.profile?.savedAddresses || savedAddresses,
        sessionToken: customerProfile.sessionToken,
        emailVerified: true,
        connectedAt: new Date().toISOString(),
      });

      setOrders(data.orders || []);
      setWishlistProducts(data.wishlistProducts || []);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setErrorMsg('Network error while saving profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAddressPincode(pin: string) {
    const cleanPin = pin.replace(/\D/g, '').slice(0, 6);
    setAddrPincode(cleanPin);
    if (cleanPin.length !== 6) {
      setAddrPinCheckMsg('');
      setAddrPinServiceable(null);
      return;
    }
    try {
      const res = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: cleanPin, address: addrLine || 'Main Road' }),
      });
      const data = await res.json();
      if (data.serviceable) {
        setAddrPinServiceable(true);
        const loc = [data.district, data.state].filter(Boolean).join(', ');
        if (loc) setAddrCityState(loc);
        setAddrPinCheckMsg(
          lang === 'hi'
            ? data.message_hi || `पिन कोड ${cleanPin} पर डिलीवरी उपलब्ध है (${loc})`
            : data.message_en || `Serviceable PIN ${cleanPin} (${loc})`
        );
      } else {
        setAddrPinServiceable(false);
        setAddrPinCheckMsg(
          lang === 'hi'
            ? data.reason_hi || 'इस पिन कोड पर डिलीवरी उपलब्ध नहीं है।'
            : data.reason_en || 'PIN code is not serviceable.'
        );
      }
    } catch {
      // ignore
    }
  }

  async function handleAddSavedAddress(e: React.FormEvent) {
    e.preventDefault();
    const cleanPin = addrPincode.replace(/\D/g, '').slice(0, 6);
    const cleanPhone = (addrPhone || phoneInput).replace(/\D/g, '').slice(-10);
    if (cleanPin.length !== 6 || addrLine.trim().length < 6) {
      setErrorMsg(
        lang === 'hi'
          ? 'कृपया 6-अंकों का पिन कोड और पूरा पता दर्ज करें।'
          : 'Please enter a valid 6-digit PIN code and complete street/house address.'
      );
      return;
    }
    const newAddr: SavedAddressItem = {
      id: `addr-${Date.now()}`,
      label: addrLabel,
      recipientName: (addrRecipient || nameInput || 'Valued Patron').trim(),
      phone: cleanPhone || '9876543210',
      pincode: cleanPin,
      cityState: addrCityState.trim() || 'Jaipur, Rajasthan',
      addressLine: addrLine.trim(),
      isDefault: savedAddresses.length === 0,
    };
    const nextList = [...savedAddresses, newAddr];
    await syncAddressBookToServer(nextList);
    setAddrLine('');
    setAddrPincode('');
    setAddrPinCheckMsg('');
    setAddrPinServiceable(null);
  }

  async function handleSetDefaultAddress(id: string) {
    const nextList = savedAddresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    await syncAddressBookToServer(nextList);
  }

  async function handleDeleteAddress(id: string) {
    const filtered = savedAddresses.filter((a) => a.id !== id);
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }
    await syncAddressBookToServer(filtered);
  }

  async function syncAddressBookToServer(nextList: SavedAddressItem[]) {
    setSavedAddresses(nextList);
    const def = nextList.find((a) => a.isDefault) || nextList[0];
    if (def) {
      setPincodeInput(def.pincode);
      setCityStateInput(def.cityState);
      setAddressInput(def.addressLine);
    }
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-token': customerProfile.sessionToken || '',
        },
        body: JSON.stringify({
          action: 'save',
          email: customerProfile.email,
          sessionToken: customerProfile.sessionToken,
          name: nameInput,
          phone: phoneInput,
          pincode: def?.pincode || pincodeInput,
          cityState: def?.cityState || cityStateInput,
          address: def?.addressLine || addressInput,
          savedAddresses: nextList,
          wishlist,
        }),
      });
      const data = await res.json();
      if (res.ok && data.profile) {
        setCustomerProfile({
          ...customerProfile,
          pincode: data.profile.pincode,
          cityState: data.profile.cityState,
          address: data.profile.address,
          savedAddresses: data.profile.savedAddresses || nextList,
        });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch {
      // ignore
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdStatusMsg('');
    setErrorMsg('');
    if (updatedPwd.length < 6) {
      setErrorMsg(
        lang === 'hi'
          ? 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'New password must be at least 6 characters long.'
      );
      return;
    }
    try {
      const res = await fetch('/api/account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-token': customerProfile.sessionToken || '',
        },
        body: JSON.stringify({
          action: 'change_password',
          email: customerProfile.email,
          sessionToken: customerProfile.sessionToken,
          currentPassword: currentPwd,
          newPassword: updatedPwd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(
          lang === 'hi' && data.error_hi
            ? data.error_hi
            : data.error || 'Could not update password.'
        );
        return;
      }
      setCurrentPwd('');
      setUpdatedPwd('');
      setPwdStatusMsg(
        lang === 'hi'
          ? 'आपका पासवर्ड सफलतापूर्वक अपडेट हो गया है।'
          : 'Your account password has been updated successfully.'
      );
    } catch {
      setErrorMsg('Network error while updating password.');
    }
  }

  function handleMoveWishlistItemToBag(item: WishlistProduct) {
    const chosenSize = wishlistSizes[item.id] || item.sizes?.[0] || 'M';
    const quote = getProductPriceForSize(item as never, chosenSize);
    const unitPrice = quote.price_paise;
    addToCart({
      id: item.id,
      name: item.name,
      name_hi: item.name_hi,
      price_paise: unitPrice,
      qty: 1,
      size: chosenSize,
      image_url: item.image_url,
      category: item.category,
    });
    setCartToast(
      lang === 'hi'
        ? `"${item.name_hi}" (${chosenSize}) आपके बैग में जोड़ दिया गया है।`
        : `Added "${item.name}" (${chosenSize}) to your Shopping Bag.`
    );
    setTimeout(() => setCartToast(''), 3000);
  }

  function handleBuyAgainOrder(order: OrderSummary) {
    for (const item of order.items) {
      addToCart({
        id: item.id,
        name: item.name,
        name_hi: item.name_hi,
        price_paise: item.price_paise,
        qty: item.qty,
        size: item.size,
        image_url: item.image_url,
      });
    }
    setCartToast(
      lang === 'hi'
        ? `ऑर्डर #${order.order_id} के सभी आइटम आपके बैग में जोड़ दिए गए हैं।`
        : `All items from Order #${order.order_id} have been added to your Shopping Bag.`
    );
    setTimeout(() => setCartToast(''), 3500);
  }

  const isConnected = Boolean(customerProfile.email && customerProfile.sessionToken);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || typeof window === 'undefined') return;
    const w = window as unknown as {
      google?: {
        accounts?: {
          id?: {
            initialize: (cfg: Record<string, unknown>) => void;
            renderButton: (el: HTMLElement | null, cfg: Record<string, unknown>) => void;
          };
        };
      };
    };
    if (w.google?.accounts?.id) {
      w.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) return;
          setLoading(true);
          setErrorMsg('');
          try {
            const res = await fetch('/api/account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'google_oauth',
                credential: response.credential,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setErrorMsg(data.error || 'Google Sign-In verification failed');
              return;
            }
            applyAuthenticatedSession(data);
          } catch {
            setErrorMsg('Failed to verify Google Sign-In');
          } finally {
            setLoading(false);
          }
        },
      });
      const btnContainer = document.getElementById('google-signin-button-slot');
      if (btnContainer) {
        w.google.accounts.id.renderButton(btnContainer, {
          theme: 'outline',
          size: 'large',
          width: 320,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2]">
      <Script src="https://accounts.google.com/gsi/client" strategy="lazyOnload" />
      <DemoBanner />
      <Header />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Top Breadcrumb & Title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 pb-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-amber-800 font-semibold">
              {lang === 'hi'
                ? 'वेरिफाइड ग्राहक खाता एवं ऑर्डर हब'
                : 'Verified Customer Account, Orders, Wishlist & Address Book'}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 mt-1">
              {isConnected
                ? lang === 'hi'
                  ? `नमस्ते, ${customerProfile.name || customerProfile.email}`
                  : `Hello, ${customerProfile.name || customerProfile.email.split('@')[0]}`
                : lang === 'hi'
                ? 'ग्राहक साइन-इन एवं ईमेल OTP वेरिफिकेशन'
                : 'Sign In or Create Verified Account'}
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              {lang === 'hi'
                ? 'ईमेल पासवर्ड या 6-अंकों के ईमेल OTP से लॉग इन करें — आपके सभी ऑर्डर, जीएसटी बिल, विशलिस्ट और डिलीवरी पते एक ही खाते से सिंक रहते हैं।'
                : 'Sign in with your Password or a 6-digit Email OTP — your Orders, GST Invoices, Wishlist, and Delivery Addresses sync automatically across the storefront and checkout.'}
            </p>
          </div>

          {isConnected && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2.5 bg-emerald-950 text-amber-200 px-4 py-2 rounded-full text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{customerProfile.email}</span>
                <span className="bg-emerald-800/90 text-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  {lang === 'hi' ? 'सत्यापित' : 'Verified'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  disconnectCustomerProfile();
                  setOrders([]);
                  setWishlistProducts([]);
                  setSavedAddresses([]);
                }}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 border border-rose-200 bg-white px-3.5 py-2 rounded-full transition"
              >
                {lang === 'hi' ? 'साइन आउट करें' : 'Sign Out'}
              </button>
            </div>
          )}
        </div>

        {/* Toast Notification */}
        {cartToast && (
          <div className="mb-6 bg-stone-900 text-amber-200 px-5 py-3.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md">
            <span>{cartToast}</span>
            <Link
              href="/cart"
              className="underline text-white hover:text-amber-300 ml-4 uppercase tracking-wider text-[11px]"
            >
              {lang === 'hi' ? 'बैग देखें' : 'View Shopping Bag'}
            </Link>
          </div>
        )}

        {savedSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-900 px-5 py-3.5 rounded-xl text-xs font-semibold">
            {lang === 'hi'
              ? 'आपका खाता, विशलिस्ट और डिलीवरी पता सफलतापूर्वक सिंक हो गया है!'
              : 'Your verified account, wishlist, and delivery addresses are synced!'}
          </div>
        )}

        {!isConnected ? (
          /* ================= UNAUTHENTICATED VIEW: 4 VERIFIED AUTH FLOWS ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">
                {lang === 'hi' ? 'अपना खाता एक्सेस करें' : 'Access Your Zariya Jaipur Account'}
              </h2>
              <p className="text-xs text-stone-500 mb-5">
                {lang === 'hi'
                  ? 'पासवर्ड, ईमेल OTP, नया अकाउंट या पासवर्ड रीसेट में से चुनें।'
                  : 'Choose Password Sign-In, Instant Email OTP Sign-In, New Account Registration, or Password Reset.'}
              </p>

              {/* 4-Way Auth Mode Selector */}
              <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl bg-stone-100 p-1 mb-6 border border-stone-200 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMsg('');
                    setOtpStepPending(false);
                    setOtpNotice('');
                    setMailNotification(null);
                  }}
                  className={`py-2 px-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition ${
                    authMode === 'login'
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {lang === 'hi' ? 'पासवर्ड लॉगिन' : 'Password Login'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login_otp');
                    setErrorMsg('');
                    setOtpStepPending(false);
                    setOtpNotice('');
                    setMailNotification(null);
                  }}
                  className={`py-2 px-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition ${
                    authMode === 'login_otp'
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {lang === 'hi' ? 'ईमेल OTP लॉगिन' : 'Login via OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMsg('');
                    setOtpStepPending(false);
                    setOtpNotice('');
                    setMailNotification(null);
                  }}
                  className={`py-2 px-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition ${
                    authMode === 'register'
                      ? 'bg-stone-900 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {lang === 'hi' ? 'नया अकाउंट' : 'Create Account'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot');
                    setErrorMsg('');
                    setOtpStepPending(false);
                    setOtpNotice('');
                    setMailNotification(null);
                  }}
                  className={`py-2 px-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition ${
                    authMode === 'forgot'
                      ? 'bg-amber-800 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password'}
                </button>
              </div>

              {/* Official Google OAuth Slot (if configured) */}
              {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
                <div className="mb-5">
                  <div id="google-signin-button-slot" className="flex justify-center" />
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="border-t border-stone-200 w-full" />
                    <span className="bg-white px-3 text-[10px] uppercase tracking-widest text-stone-400">
                      OR
                    </span>
                    <div className="border-t border-stone-200 w-full" />
                  </div>
                </div>
              )}

              {/* Instant Demo Patron Fill Banner for quick evaluation */}
              <div className="mb-5 rounded-xl bg-amber-50/90 border border-amber-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-950">
                    {lang === 'hi' ? 'तुरंत टेस्ट करने के लिए वेरिफाइड अकाउंट' : 'Verified Patron Account Ready'}
                  </p>
                  <p className="text-[11px] text-amber-900">
                    Email: <span className="font-mono font-semibold">priya.sharma@gmail.com</span> · Password:{' '}
                    <span className="font-mono font-semibold">Priya@2026</span> · OTP:{' '}
                    <span className="font-mono font-semibold">100108</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmailInput('priya.sharma@gmail.com');
                    setPasswordInput('Priya@2026');
                    setOtpInput('100108');
                    setErrorMsg('');
                  }}
                  className="shrink-0 bg-amber-900 hover:bg-stone-900 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition"
                >
                  {lang === 'hi' ? 'ऑटो-फिल करें' : 'Auto-Fill'}
                </button>
              </div>

              <form onSubmit={handleConnectOrSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    {lang === 'hi' ? 'ईमेल आईडी (Gmail / Email) *' : 'Email Address (Gmail / Official Email) *'}
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                  />
                </div>

                {/* Password field for 'login' or 'register' */}
                {(authMode === 'login' || authMode === 'register') && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700">
                        {authMode === 'login'
                          ? lang === 'hi'
                            ? 'अकाउंट पासवर्ड *'
                            : 'Account Password *'
                          : lang === 'hi'
                          ? 'नया पासवर्ड बनाएं (कम से कम 6 अक्षर) *'
                          : 'Create Account Password (min 6 chars) *'}
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('forgot');
                            setOtpStepPending(false);
                            setErrorMsg('');
                          }}
                          className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline"
                        >
                          {lang === 'hi' ? 'पासवर्ड भूल गए?' : 'Forgot Password?'}
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={
                        authMode === 'login'
                          ? lang === 'hi'
                            ? 'अपना पासवर्ड दर्ज करें'
                            : 'Enter your account password'
                          : lang === 'hi'
                          ? 'कम से कम 6 अक्षरों का पासवर्ड'
                          : 'Create a strong password (min 6 chars)'
                      }
                      className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                    />
                  </div>
                )}

                {/* Registration Name & Mobile fields */}
                {authMode === 'register' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                        {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder={lang === 'hi' ? 'जैसे: प्रिया शर्मा' : 'e.g. Priya Sharma'}
                        className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                        {lang === 'hi' ? '10-अंकों का मोबाइल नंबर *' : '10-Digit Mobile Number *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Delivered Email OTP Inbox Banner + 6-Digit OTP Input when OTP step is active */}
                {otpStepPending && (
                  <div className="space-y-3 pt-1">
                    {mailNotification && (
                      <div className="rounded-xl bg-stone-900 text-stone-100 p-4 border border-amber-500/40 shadow-md">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                            {lang === 'hi'
                              ? 'डिलीवर किया गया ईमेल वेरिफिकेशन कोड'
                              : 'Delivered Email Verification Code (Outbox)'}
                          </span>
                          <span className="text-[10px] text-emerald-300 font-semibold">
                            {lang === 'hi' ? 'वैधता: 10 मिनट' : `Valid ${mailNotification.expiresInMinutes} mins`}
                          </span>
                        </div>
                        <p className="text-xs text-stone-300 mb-2">
                          To: <span className="font-mono text-white">{mailNotification.to}</span>
                        </p>
                        <div className="flex items-center justify-between bg-stone-800 border border-stone-700 rounded-lg px-3.5 py-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-stone-400 block">
                              {lang === 'hi' ? 'आपका 6-अंकों का OTP कोड' : 'Your 6-Digit OTP Code'}
                            </span>
                            <span className="font-mono text-xl font-bold tracking-[0.25em] text-amber-300">
                              {mailNotification.otpCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOtpInput(mailNotification.otpCode)}
                            className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition"
                          >
                            {lang === 'hi' ? 'कोड भरें' : 'Auto-Fill OTP'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="rounded-xl bg-amber-50/90 border border-amber-300 p-4 space-y-3">
                      <p className="text-xs text-amber-950 font-semibold">{otpNotice}</p>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1.5">
                          {lang === 'hi'
                            ? '6-अंकों का ईमेल OTP दर्ज करें *'
                            : 'Enter 6-Digit Email Verification Code (OTP) *'}
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="6-digit OTP code"
                          className="w-full rounded-lg border border-stone-400 bg-white px-3.5 py-2.5 text-base font-mono tracking-[0.3em] font-bold text-stone-900 focus:border-amber-700 focus:outline-none"
                        />
                      </div>

                      {authMode === 'forgot' && (
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-800 mb-1.5">
                            {lang === 'hi'
                              ? 'नया पासवर्ड सेट करें (कम से कम 6 अक्षर) *'
                              : 'Set New Account Password (min 6 chars) *'}
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            placeholder={lang === 'hi' ? 'नया पासवर्ड दर्ज करें' : 'Enter your new password'}
                            className="w-full rounded-lg border border-stone-400 bg-white px-3.5 py-2.5 text-sm text-stone-900 focus:border-amber-700 focus:outline-none"
                          />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setOtpStepPending(false);
                          setOtpInput('');
                          setOtpNotice('');
                          setMailNotification(null);
                        }}
                        className="text-[11px] font-semibold text-amber-900 underline"
                      >
                        {lang === 'hi'
                          ? 'ईमेल बदलें या नया OTP कोड मंगाएं'
                          : 'Change details or request a new OTP code'}
                      </button>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3.5 py-2.5 font-medium">
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-stone-900 hover:bg-amber-900 text-white font-semibold py-3.5 px-4 text-xs uppercase tracking-widest transition disabled:opacity-50"
                >
                  {loading
                    ? lang === 'hi'
                      ? 'कृपया प्रतीक्षा करें...'
                      : 'Processing...'
                    : authMode === 'login'
                    ? lang === 'hi'
                      ? 'पासवर्ड से साइन इन करें'
                      : 'Sign In with Password'
                    : authMode === 'login_otp'
                    ? otpStepPending
                      ? lang === 'hi'
                        ? 'OTP सत्यापित करें और लॉग इन करें'
                        : 'Verify 6-Digit OTP & Sign In'
                      : lang === 'hi'
                      ? 'ईमेल पर 6-अंकों का लॉगिन OTP भेजें'
                      : 'Send 6-Digit Login OTP to Email'
                    : authMode === 'forgot'
                    ? otpStepPending
                      ? lang === 'hi'
                        ? 'OTP सत्यापित करें और नया पासवर्ड सेव करें'
                        : 'Verify OTP & Reset Password'
                      : lang === 'hi'
                      ? 'ईमेल पर पासवर्ड रीसेट OTP भेजें'
                      : 'Send 6-Digit Password Reset OTP'
                    : otpStepPending
                    ? lang === 'hi'
                      ? 'OTP सत्यापित करें और अकाउंट बनाएं'
                      : 'Verify 6-Digit OTP & Create Account'
                    : lang === 'hi'
                    ? '6-अंकों का ईमेल वेरिफिकेशन OTP भेजें'
                    : 'Send 6-Digit Verification OTP to Email'}
                </button>
              </form>
            </div>

            {/* Right Column: Amazon/Flipkart Account Ecosystem Benefits */}
            <div className="lg:col-span-6 space-y-5">
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800">
                  {lang === 'hi' ? 'एकीकृत ग्राहक खाता' : 'Unified Single-Account Architecture'}
                </span>
                <h3 className="font-serif text-2xl font-bold text-stone-900 mt-1 mb-4">
                  {lang === 'hi'
                    ? 'एक वेरिफाइड अकाउंट से आपके सभी कार्य'
                    : 'Everything Tied to Your Verified Account'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                      {lang === 'hi' ? '1. ऑर्डर और जीएसटी चालान' : '1. Orders & GST Tax Invoices'}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {lang === 'hi'
                        ? 'आपके ईमेल से किए गए सभी ऑर्डर, लाइव ट्रैकिंग और CGST नियम 46(b) चालान एक जगह उपलब्ध।'
                        : 'View every order placed with your email, track live AWB status, download CGST Rule 46(b) invoices, or reorder in one click.'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                      {lang === 'hi' ? '2. क्लाउड विशलिस्ट सिंक' : '2. Persistent Cloud Wishlist'}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {lang === 'hi'
                        ? 'किसी भी कुर्ती, बैग या ज्वेलरी को विशलिस्ट करें — यह आपके अकाउंट और डेटाबेस में सुरक्षित रहती है।'
                        : 'Items you heart on any page are saved directly to your backend account and database across sessions.'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                      {lang === 'hi' ? '3. सेव किए गए डिलीवरी पते' : '3. Saved Address Book'}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {lang === 'hi'
                        ? 'घर और ऑफिस के पते पिन कोड जांच के साथ सेव करें ताकि चेकआउट तुरंत हो सके।'
                        : 'Save multiple verified Home/Work addresses with PIN serviceability check for 1-click auto-fill at Checkout.'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-200/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-900 mb-1">
                      {lang === 'hi' ? '4. पासवर्ड और ईमेल OTP सुरक्षा' : '4. Password + Email OTP Security'}
                    </p>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {lang === 'hi'
                        ? 'पासवर्ड या 6-अंकों के ईमेल OTP से लॉग इन करें और कभी भी पासवर्ड रीसेट करें।'
                        : 'Sign in with your password or a 6-digit Email OTP, and reset forgotten passwords anytime via Email OTP.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ================= AUTHENTICATED VIEW: 4-TAB AMAZON / FLIPKART ACCOUNT HUB ================= */
          <div className="space-y-6">
            {/* Account Summary Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setActiveHubTab('orders')}
                className={`text-left rounded-2xl p-4 border transition ${
                  activeHubTab === 'orders'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-amber-700'
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-75 block">
                  {lang === 'hi' ? 'मेरे ऑर्डर और बिल' : 'Orders & GST Bills'}
                </span>
                <span className="font-serif text-2xl font-bold mt-1 block">{orders.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHubTab('wishlist')}
                className={`text-left rounded-2xl p-4 border transition ${
                  activeHubTab === 'wishlist'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-amber-700'
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-75 block">
                  {lang === 'hi' ? 'मेरी विशलिस्ट' : 'Saved Wishlist'}
                </span>
                <span className="font-serif text-2xl font-bold mt-1 block">
                  {wishlistProducts.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHubTab('addresses')}
                className={`text-left rounded-2xl p-4 border transition ${
                  activeHubTab === 'addresses'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-amber-700'
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-75 block">
                  {lang === 'hi' ? 'डिलीवरी पते' : 'Saved Addresses'}
                </span>
                <span className="font-serif text-2xl font-bold mt-1 block">
                  {savedAddresses.length || (addressInput ? 1 : 0)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveHubTab('security')}
                className={`text-left rounded-2xl p-4 border transition ${
                  activeHubTab === 'security'
                    ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                    : 'bg-white text-stone-900 border-stone-200 hover:border-amber-700'
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-75 block">
                  {lang === 'hi' ? 'प्रोफ़ाइल और पासवर्ड' : 'Profile & Security'}
                </span>
                <span className="font-serif text-base font-bold mt-1.5 block truncate">
                  {customerProfile.phone ? `+91 ${customerProfile.phone}` : 'Verified'}
                </span>
              </button>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 font-medium">
                {errorMsg}
              </p>
            )}

            {/* TAB 1: MY ORDERS & GST INVOICES */}
            {activeHubTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      {lang === 'hi'
                        ? 'मेरे ऑर्डर, लाइव ट्रैकिंग और जीएसटी बिल'
                        : 'My Orders, Live Shipment Tracking & GST Invoices'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {lang === 'hi'
                        ? `${customerProfile.email} से जुड़े सभी ऑर्डर`
                        : `All orders linked to ${customerProfile.email}`}
                    </p>
                  </div>
                  <Link
                    href="/track"
                    className="text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-950 border border-amber-200 bg-amber-50/70 px-3.5 py-2 rounded-lg"
                  >
                    {lang === 'hi' ? 'AWB ट्रैकिंग पोर्टल' : 'Track by AWB / Order ID'}
                  </Link>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl bg-stone-50/70 border border-dashed border-stone-200">
                    <p className="font-serif text-lg text-stone-700 mb-1">
                      {lang === 'hi'
                        ? 'इस ईमेल से अभी कोई ऑर्डर नहीं मिला'
                        : 'No orders placed with this account yet'}
                    </p>
                    <p className="text-xs text-stone-500 max-w-md mx-auto mb-5">
                      {lang === 'hi'
                        ? 'जब आप इस खाते से ऑर्डर करेंगे, तो आपका ऑर्डर, ट्रैकिंग नंबर और GST बिल यहाँ अपने आप दिखेगा।'
                        : 'When you place an order while signed in, your order history, courier tracking ID, and downloadable GST tax invoice will appear here automatically.'}
                    </p>
                    <Link
                      href="/"
                      className="inline-block rounded-xl bg-stone-900 text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-amber-900 transition"
                    >
                      {lang === 'hi' ? 'कलेक्शन देखें' : 'Explore Collection'}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((o) => (
                      <div
                        key={o.order_id}
                        className="rounded-xl border border-stone-200 p-4 sm:p-5 hover:border-amber-700/50 transition bg-[#FAF7F2]/50"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-bold text-stone-900">
                                {o.order_id}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                  o.status === 'CONFIRMED' || o.status === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : 'bg-amber-100 text-amber-900'
                                }`}
                              >
                                {o.fulfillment_status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {new Date(o.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              · GST Invoice: <span className="font-mono">{o.invoice_number}</span>
                              {o.tracking_id ? (
                                <>
                                  {' '}
                                  · AWB: <span className="font-mono">{o.tracking_id}</span>
                                </>
                              ) : null}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-serif text-lg font-bold text-stone-900">
                              {formatINR(o.amount_paise)}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              {o.courier_name}
                            </p>
                          </div>
                        </div>

                        <div className="py-3 flex flex-wrap gap-3">
                          {o.items.map((item, idx) => (
                            <Link
                              key={`${o.order_id}-${idx}`}
                              href={`/products/${item.id}`}
                              className="flex items-center gap-2.5 bg-white rounded-lg border border-stone-200/80 px-2.5 py-1.5 hover:border-amber-700 transition"
                            >
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-10 h-12 object-cover rounded"
                              />
                              <div>
                                <p className="text-xs font-semibold text-stone-900 line-clamp-1">
                                  {lang === 'hi' && item.name_hi ? item.name_hi : item.name}
                                </p>
                                <p className="text-[11px] text-stone-500">
                                  Size: {item.size} × {item.qty}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>

                        <div className="pt-3 border-t border-stone-200/70 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-stone-600">
                            {o.tracking_id ? (
                              <span>
                                AWB:{' '}
                                <strong className="font-mono text-stone-900">
                                  {o.tracking_id}
                                </strong>
                              </span>
                            ) : (
                              <span>
                                {lang === 'hi'
                                  ? 'भुगतान की प्रतीक्षा है'
                                  : 'Awaiting Payment Verification'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleBuyAgainOrder(o)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-950 transition"
                            >
                              {lang === 'hi' ? 'दोबारा खरीदें' : 'Buy Again'}
                            </button>
                            <Link
                              href={`/order/${encodeURIComponent(o.order_id)}`}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800"
                            >
                              {lang === 'hi' ? 'ऑर्डर विवरण' : 'Order Details'}
                            </Link>
                            {o.tracking_id && (
                              <Link
                                href={`/track?id=${encodeURIComponent(o.tracking_id)}`}
                                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800"
                              >
                                {lang === 'hi' ? 'ट्रैक करें' : 'Track Package'}
                              </Link>
                            )}
                            <Link
                              href={`/order/${encodeURIComponent(o.order_id)}/invoice`}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-amber-900 text-white"
                            >
                              {lang === 'hi' ? 'जीएसटी बिल (PDF)' : 'GST Invoice'}
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MY WISHLIST & SAVED ITEMS (SYNCED WITH BACKEND & DB) */}
            {activeHubTab === 'wishlist' && (
              <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-stone-100 pb-4">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-stone-900">
                      {lang === 'hi'
                        ? 'मेरी सेव की गई विशलिस्ट (अकाउंट सिंक्ड)'
                        : 'My Account Wishlist (Synced with Backend & Database)'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {lang === 'hi'
                        ? 'साइज चुनें और सीधे अपने शॉपिंग बैग में मूव करें'
                        : 'Select your preferred size and move saved pieces directly to your Shopping Bag'}
                    </p>
                  </div>
                  <Link
                    href="/wishlist"
                    className="text-xs font-bold uppercase tracking-wider text-amber-800 hover:text-amber-950 underline"
                  >
                    {lang === 'hi' ? 'पूर्ण विशलिस्ट पेज खोलें' : 'Open Full Wishlist View'}
                  </Link>
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="text-center py-12 px-4 rounded-xl bg-stone-50/70 border border-dashed border-stone-200">
                    <p className="font-serif text-lg text-stone-700 mb-1">
                      {lang === 'hi'
                        ? 'आपकी विशलिस्ट में अभी कोई आइटम नहीं है'
                        : 'Your account wishlist is currently empty'}
                    </p>
                    <p className="text-xs text-stone-500 max-w-md mx-auto mb-5">
                      {lang === 'hi'
                        ? 'किसी भी प्रोडक्ट पर हार्ट आइकन दबाएं, वह तुरंत आपके खाते में सेव हो जाएगा।'
                        : 'Tap the heart icon on any product across the store and it will automatically sync to your account here.'}
                    </p>
                    <Link
                      href="/"
                      className="inline-block rounded-xl bg-stone-900 text-white px-5 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-amber-900 transition"
                    >
                      {lang === 'hi' ? 'शॉपिंग शुरू करें' : 'Browse Collection'}
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wishlistProducts.map((item) => {
                      const availableSizes =
                        item.sizes && item.sizes.length > 0 ? item.sizes : ['M'];
                      const activeSize = wishlistSizes[item.id] || availableSizes[0];
                      const activeQuote = getProductPriceForSize(item as never, activeSize);
                      const activePrice = activeQuote.price_paise;

                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-stone-200 bg-white overflow-hidden flex flex-col justify-between hover:border-amber-700/60 transition shadow-sm"
                        >
                          <div>
                            <Link href={`/products/${item.id}`} className="block relative aspect-[4/5] bg-stone-100 overflow-hidden">
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover hover:scale-105 transition duration-500"
                              />
                            </Link>
                            <div className="p-4">
                              <Link href={`/products/${item.id}`}>
                                <h3 className="font-serif text-base font-bold text-stone-900 line-clamp-1 hover:text-amber-800">
                                  {lang === 'hi' ? item.name_hi : item.name}
                                </h3>
                              </Link>
                              <p className="font-serif text-lg font-bold text-stone-900 mt-1">
                                {formatINR(activePrice)}
                              </p>

                              {/* Size Selector */}
                              <div className="mt-3">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
                                  {lang === 'hi' ? 'साइज चुनें:' : 'Select Size:'}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {availableSizes.map((sz) => (
                                    <button
                                      key={sz}
                                      type="button"
                                      onClick={() =>
                                        setWishlistSizes((prev) => ({ ...prev, [item.id]: sz }))
                                      }
                                      className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                        activeSize === sz
                                          ? 'bg-stone-900 text-white border-stone-900'
                                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                                      }`}
                                    >
                                      {formatEthnicSizeLabel(sz, item.category)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 pt-0 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleMoveWishlistItemToBag(item)}
                              className="flex-1 bg-stone-900 hover:bg-amber-900 text-white text-[11px] font-bold uppercase tracking-wider py-2.5 px-3 rounded-lg transition"
                            >
                              {lang === 'hi' ? 'बैग में जोड़ें' : 'Move to Bag'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toggleWishlist(item.id);
                                setWishlistProducts((prev) =>
                                  prev.filter((p) => p.id !== item.id)
                                );
                              }}
                              className="border border-stone-300 hover:border-rose-400 text-stone-600 hover:text-rose-700 text-[11px] font-semibold py-2.5 px-3 rounded-lg transition"
                            >
                              {lang === 'hi' ? 'हटाएं' : 'Remove'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: SAVED DELIVERY ADDRESSES (ADDRESS BOOK) */}
            {activeHubTab === 'addresses' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">
                    {lang === 'hi' ? 'मेरे सेव किए गए डिलीवरी पते' : 'Saved Delivery Addresses'}
                  </h2>
                  <p className="text-xs text-stone-500 mb-5">
                    {lang === 'hi'
                      ? 'डिफ़ॉल्ट पता आपके चेकआउट पेज पर अपने आप भर जाता है।'
                      : 'Your Default Address is automatically pre-filled on the Checkout page.'}
                  </p>

                  {savedAddresses.length === 0 ? (
                    <div className="rounded-xl bg-stone-50 border border-dashed border-stone-200 p-8 text-center">
                      <p className="text-sm font-semibold text-stone-700">
                        {lang === 'hi'
                          ? 'कोई पता सेव नहीं है। दाईं ओर से अपना पहला पता जोड़ें।'
                          : 'No saved addresses yet. Add your Home or Work address using the form.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {savedAddresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`rounded-xl border p-4 transition ${
                            addr.isDefault
                              ? 'border-amber-700 bg-amber-50/30'
                              : 'border-stone-200 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-stone-900 text-white px-2.5 py-0.5 rounded">
                                {addr.label}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded">
                                  {lang === 'hi' ? 'डिफ़ॉल्ट पता' : 'Default Checkout Address'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="text-[11px] font-semibold text-amber-800 hover:underline"
                                >
                                  {lang === 'hi' ? 'डिफ़ॉल्ट बनाएं' : 'Set Default'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="text-[11px] font-semibold text-rose-700 hover:underline"
                              >
                                {lang === 'hi' ? 'हटाएं' : 'Delete'}
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-stone-900">
                            {addr.recipientName} · +91 {addr.phone}
                          </p>
                          <p className="text-xs text-stone-600 mt-0.5">
                            {addr.addressLine}, {addr.cityState} — PIN:{' '}
                            <strong className="font-mono">{addr.pincode}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New Address Form with Live PIN Serviceability Check */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
                  <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">
                    {lang === 'hi' ? 'नया डिलीवरी पता जोड़ें' : 'Add New Delivery Address'}
                  </h3>
                  <p className="text-xs text-stone-500 mb-4">
                    {lang === 'hi'
                      ? 'स्टोर ओनर के सर्विसएबल पिन कोड नेटवर्क से तुरंत सत्यापित'
                      : 'Verified live against our Store Owner PIN serviceability network'}
                  </p>

                  <form onSubmit={handleAddSavedAddress} className="space-y-3.5">
                    <div className="flex gap-2">
                      {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setAddrLabel(lbl)}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition ${
                            addrLabel === lbl
                              ? 'bg-stone-900 text-white border-stone-900'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? 'प्राप्तकर्ता का नाम' : 'Recipient Name'}
                        </label>
                        <input
                          type="text"
                          value={addrRecipient}
                          onChange={(e) => setAddrRecipient(e.target.value)}
                          placeholder={nameInput || 'Priya Sharma'}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                        </label>
                        <input
                          type="tel"
                          value={addrPhone}
                          onChange={(e) =>
                            setAddrPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                          }
                          placeholder={phoneInput || '9876543210'}
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? '6-अंकों का पिन कोड *' : '6-Digit PIN Code *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={addrPincode}
                          onChange={(e) => handleVerifyAddressPincode(e.target.value)}
                          placeholder="302001"
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs font-mono text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? 'शहर और राज्य' : 'City & State'}
                        </label>
                        <input
                          type="text"
                          value={addrCityState}
                          onChange={(e) => setAddrCityState(e.target.value)}
                          placeholder="Jaipur, Rajasthan"
                          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
                        />
                      </div>
                    </div>

                    {addrPinCheckMsg && (
                      <p
                        className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border ${
                          addrPinServiceable
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        {addrPinCheckMsg}
                      </p>
                    )}

                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        {lang === 'hi'
                          ? 'मकान / फ्लैट / गली / लैंडमार्क *'
                          : 'House / Flat / Street / Landmark *'}
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={addrLine}
                        onChange={(e) => setAddrLine(e.target.value)}
                        placeholder="Flat 102, Rose Residency, MI Road"
                        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-xs text-stone-900"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-stone-900 hover:bg-amber-900 text-white font-semibold py-2.5 px-4 text-xs uppercase tracking-widest transition"
                    >
                      {lang === 'hi' ? 'पता सेव करें' : 'Save Address to Account'}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* TAB 4: PROFILE DETAILS & PASSWORD SECURITY */}
            {activeHubTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">
                    {lang === 'hi' ? 'व्यक्तिगत प्रोफ़ाइल विवरण' : 'Personal Profile & Primary Contact'}
                  </h2>
                  <p className="text-xs text-stone-500 mb-5">
                    {lang === 'hi'
                      ? 'आपका नाम, मोबाइल नंबर और प्राथमिक पता अपडेट करें'
                      : 'Update your full name, registered mobile number, and primary checkout address'}
                  </p>

                  <form onSubmit={handleConnectOrSave} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        {lang === 'hi' ? 'वेरिफाइड ईमेल आईडी' : 'Verified Account Email'}
                      </label>
                      <input
                        type="email"
                        disabled
                        value={emailInput}
                        className="w-full rounded-lg border border-stone-200 bg-stone-100 px-3.5 py-2.5 text-sm text-stone-600 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? 'पूरा नाम' : 'Full Name'}
                        </label>
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? 'मोबाइल नंबर' : '10-Digit Mobile'}
                        </label>
                        <input
                          type="tel"
                          value={phoneInput}
                          onChange={(e) =>
                            setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))
                          }
                          className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? 'पिन कोड' : 'Primary PIN Code'}
                        </label>
                        <input
                          type="text"
                          value={pincodeInput}
                          onChange={(e) =>
                            setPincodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))
                          }
                          className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                          {lang === 'hi' ? 'शहर / राज्य' : 'City & State'}
                        </label>
                        <input
                          type="text"
                          value={cityStateInput}
                          onChange={(e) => setCityStateInput(e.target.value)}
                          className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        {lang === 'hi' ? 'प्राथमिक डिलीवरी पता' : 'Primary Delivery Address'}
                      </label>
                      <textarea
                        rows={2}
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-stone-900 hover:bg-amber-900 text-white font-semibold py-3 px-4 text-xs uppercase tracking-widest transition"
                    >
                      {lang === 'hi' ? 'प्रोफ़ाइल सेव करें' : 'Save Profile Changes'}
                    </button>
                  </form>
                </div>

                {/* Change Password Card */}
                <div className="lg:col-span-6 bg-white rounded-2xl border border-stone-200/90 p-6 shadow-sm">
                  <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">
                    {lang === 'hi' ? 'पासवर्ड और सुरक्षा सेटिंग्स' : 'Password & Account Security'}
                  </h2>
                  <p className="text-xs text-stone-500 mb-5">
                    {lang === 'hi'
                      ? 'अपने खाते का पासवर्ड बदलें'
                      : 'Update your account password anytime'}
                  </p>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        {lang === 'hi'
                          ? 'वर्तमान पासवर्ड (वैकल्पिक यदि OTP से लॉगिन किया हो)'
                          : 'Current Password (optional if signed in via OTP)'}
                      </label>
                      <input
                        type="password"
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1">
                        {lang === 'hi'
                          ? 'नया पासवर्ड (कम से कम 6 अक्षर) *'
                          : 'New Password (minimum 6 characters) *'}
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={updatedPwd}
                        onChange={(e) => setUpdatedPwd(e.target.value)}
                        placeholder="Enter new strong password"
                        className="w-full rounded-lg border border-stone-300 px-3.5 py-2.5 text-sm text-stone-900"
                      />
                    </div>

                    {pwdStatusMsg && (
                      <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 font-semibold">
                        {pwdStatusMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-amber-800 hover:bg-stone-900 text-white font-semibold py-3 px-4 text-xs uppercase tracking-widest transition"
                    >
                      {lang === 'hi' ? 'नया पासवर्ड अपडेट करें' : 'Update Account Password'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
