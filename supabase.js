// ══════════════════════════════════════════════════════════════════
//  TrustLink – Supabase Client + Data Layer
// ══════════════════════════════════════════════════════════════════

const SUPABASE_URL  = 'https://upxiqtczrwaygkurinvo.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweGlxdGN6cndheWdrdXJpbnZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODQzNzYsImV4cCI6MjA5OTQ2MDM3Nn0.qYXrSw1a87R1aAkgt0A0B0kKzBZXNxoXYhns9VoOlww';

// The Supabase CDN (jsdelivr UMD) exposes createClient on window.supabase
// We name our client _sb to avoid collision with the global `supabase` namespace
const _sbLib = window.supabase || window.Supabase;
const _sb = (_sbLib && _sbLib.createClient)
  ? _sbLib.createClient(SUPABASE_URL, SUPABASE_ANON)
  : null;

if (!_sb) {
  console.warn('[TrustLink] Supabase SDK not loaded — running in local/offline mode.');
}

// ── Profile normaliser: Supabase snake_case → app camelCase ──────
function normaliseProfile(p) {
  if (!p) return null;
  return {
    id:        p.id,
    name:      p.name,
    email:     p.email,
    phone:     p.phone,
    role:      p.role,
    status:    p.status,
    storeName: p.store_name  || p.storeName  || '',
    location:  p.location    || '',
    whatsapp:  p.whatsapp    || '',
    avatarUrl: p.avatar_url  || p.avatarUrl  || '',
    createdAt: p.created_at  || p.createdAt  || new Date().toISOString(),
  };
}

// ──────────────────────────────────────────
//  SESSION STATE
// ──────────────────────────────────────────
let _currentUser = null;

async function sbGetSession() {
  if (!_sb) return null;
  try {
    const { data: { session } } = await _sb.auth.getSession();
    if (!session) { _currentUser = null; return null; }
    const { data: profile } = await _sb.from('profiles').select('*').eq('id', session.user.id).single();
    _currentUser = normaliseProfile(profile);
    return _currentUser;
  } catch (e) {
    console.warn('[TrustLink] sbGetSession error:', e.message);
    return null;
  }
}

// Listen for auth state changes (login, logout, tab restore, email confirmation)
if (_sb) {
  _sb.auth.onAuthStateChange(async (event, session) => {
    console.log('[TrustLink] Auth event:', event);

    if (session) {
      try {
        // Try to fetch existing profile
        let { data: profile } = await _sb.from('profiles').select('*').eq('id', session.user.id).single();

        // EMAIL_CONFIRMED or first SIGNED_IN after confirmation → auto-create profile
        if (!profile && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          const meta = session.user.user_metadata || {};
          const role  = meta.role || 'buyer';
          const profileData = {
            id:         session.user.id,
            name:       meta.name       || session.user.email.split('@')[0],
            email:      session.user.email,
            phone:      meta.phone      || '',
            role,
            status:     role === 'buyer' ? 'approved' : 'pending',
            store_name: meta.store_name || null,
            location:   meta.location   || null,
            whatsapp:   meta.whatsapp   || null,
          };
          const { data: created } = await _sb.from('profiles').upsert(profileData).select().single();
          profile = created || profileData;
        }

        _currentUser = normaliseProfile(profile);

        // ── Auto-redirect after email confirmation ──────────────────────
        // When a user clicks the confirmation link Supabase fires SIGNED_IN
        // with the URL hash containing #access_token. We detect this and
        // redirect the user to the correct page automatically.
        const isConfirmationCallback =
          window.location.hash.includes('access_token') ||
          window.location.search.includes('confirmation_token') ||
          window.location.search.includes('token_hash');

        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && isConfirmationCallback) {
          // Clean the URL so the token doesn't stay visible
          history.replaceState(null, '', window.location.pathname);

          // Show success toast and route user
          if (typeof showToast === 'function') {
            showToast('✅ Email confirmed! You are now logged in.', 'success');
          }
          if (typeof showPage === 'function') {
            const dest = (_currentUser?.role === 'vendor') ? 'dashboard' : 'home';
            setTimeout(() => showPage(dest), 600);
          }
        }

      } catch (e) {
        console.warn('[TrustLink] Auth state change error:', e.message);
        _currentUser = null;
      }
    } else {
      _currentUser = null;
    }

    if (typeof updateHeader    === 'function') updateHeader();
    if (typeof updateCartBadge === 'function') updateCartBadge();
  });
}

// ──────────────────────────────────────────
//  AUTH HELPERS
// ──────────────────────────────────────────
async function sbLogin(email, password) {
  if (!_sb) throw new Error('Supabase not initialised');
  const { data, error } = await _sb.auth.signInWithPassword({ email, password });
  if (error) throw error;

  // Try to fetch existing profile row
  let { data: profile } = await _sb.from('profiles').select('*').eq('id', data.user.id).single();

  if (!profile) {
    // Profile doesn't exist yet (e.g. email was just confirmed).
    // Recreate it from the user metadata stored during signUp.
    const meta = data.user.user_metadata || {};
    const profileData = {
      id:         data.user.id,
      name:       meta.name        || email.split('@')[0],
      email:      data.user.email,
      phone:      meta.phone       || '',
      role:       meta.role        || 'buyer',
      status:     (meta.role || 'buyer') === 'buyer' ? 'approved' : 'pending',
      store_name: meta.store_name  || null,
      location:   meta.location    || null,
      whatsapp:   meta.whatsapp    || null,
    };
    const { data: created, error: ce } = await _sb.from('profiles').insert(profileData).select().single();
    if (ce) throw new Error('Profile setup failed. Please contact support.');
    profile = created;
  }

  _currentUser = normaliseProfile(profile);
  return _currentUser;
}

async function sbRegister({ email, password, name, phone, role, storeName, location, whatsapp }) {
  if (!_sb) throw new Error('Supabase not initialised');

  // ── Step 1: Create auth user, storing all profile data as metadata ──────
  // This always works whether or not email confirmation is enabled.
  const { data, error } = await _sb.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        role,
        store_name: storeName || null,
        location:   location  || null,
        whatsapp:   whatsapp  || null,
      },
    },
  });
  if (error) throw error;

  const profileData = {
    id:         data.user.id,
    name,       email,       phone,      role,
    status:     role === 'buyer' ? 'approved' : 'pending',
    store_name: storeName || null,
    location:   location  || null,
    whatsapp:   whatsapp  || null,
  };

  // ── Step 2: Insert profile row only when we have an active session ───────
  // If email confirmation is ON → data.session is null → skip insert here.
  // Profile will be created automatically on first login (see sbLogin above).
  if (data.session) {
    const { error: pe } = await _sb.from('profiles').insert(profileData);
    if (pe) console.warn('[TrustLink] Profile insert after signUp failed:', pe.message);
  }

  _currentUser = normaliseProfile(profileData);
  return _currentUser;
}


async function sbLogout() {
  if (_sb) await _sb.auth.signOut();
  _currentUser = null;
}

function sbCurrentUser() { return _currentUser; }

// ──────────────────────────────────────────
//  PRODUCTS
// ──────────────────────────────────────────
const SBProducts = {
  async list() {
    if (!_sb) return [];
    const { data, error } = await _sb
      .from('products').select('*, profiles!vendor_id(id,name,store_name,location,whatsapp,status)')
      .eq('status', 'approved').order('created_at', { ascending: false });
    if (error) { console.warn('SBProducts.list error:', error.message); return []; }
    return (data || []).map(flattenProduct);
  },

  async listAll() {
    if (!_sb) return [];
    const { data, error } = await _sb
      .from('products').select('*, profiles!vendor_id(id,name,store_name,location,whatsapp,status)')
      .order('created_at', { ascending: false });
    if (error) { console.warn('SBProducts.listAll error:', error.message); return []; }
    return (data || []).map(flattenProduct);
  },

  async byVendor(vendorId) {
    if (!_sb) return [];
    const { data, error } = await _sb.from('products').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    if (error) { console.warn('SBProducts.byVendor error:', error.message); return []; }
    return data || [];
  },

  async get(id) {
    if (!_sb) return null;
    const { data, error } = await _sb
      .from('products').select('*, profiles!vendor_id(id,name,store_name,location,whatsapp,status)')
      .eq('id', id).single();
    if (error) { console.warn('SBProducts.get error:', error.message); return null; }
    return flattenProduct(data);
  },

  async create(productData) {
    if (!_sb) throw new Error('Supabase not initialised');
    const u = sbCurrentUser();
    if (!u) throw new Error('Not authenticated');
    const { data, error } = await _sb.from('products').insert({
      vendor_id:   u.id,
      title:       productData.title,
      description: productData.description,
      price:       productData.price,
      category:    productData.category,
      stock:       productData.stock,
      images:      productData.images || [],
      status:      'pending',
    }).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    if (!_sb) throw new Error('Supabase not initialised');
    const { data, error } = await _sb.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    if (!_sb) throw new Error('Supabase not initialised');
    const { error } = await _sb.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async approve(id) {
    return SBProducts.update(id, { status: 'approved' });
  },
};

// ──────────────────────────────────────────
//  ORDERS
// ──────────────────────────────────────────
const SBOrders = {
  async forBuyer() {
    if (!_sb) return [];
    const u = sbCurrentUser(); if (!u) return [];
    const { data, error } = await _sb.from('orders').select('*').eq('buyer_id', u.id).order('created_at', { ascending: false });
    if (error) { console.warn('SBOrders.forBuyer error:', error.message); return []; }
    return data || [];
  },

  async forVendor() {
    if (!_sb) return [];
    const u = sbCurrentUser(); if (!u) return [];
    const { data, error } = await _sb.from('orders').select('*').eq('vendor_id', u.id).order('created_at', { ascending: false });
    if (error) { console.warn('SBOrders.forVendor error:', error.message); return []; }
    return data || [];
  },

  async all() {
    if (!_sb) return [];
    const { data, error } = await _sb.from('orders').select('*').order('created_at', { ascending: false });
    if (error) { console.warn('SBOrders.all error:', error.message); return []; }
    return data || [];
  },

  async create(orderData) {
    if (!_sb) throw new Error('Supabase not initialised');
    const u = sbCurrentUser(); if (!u) throw new Error('Not authenticated');
    const { data, error } = await _sb.from('orders').insert({ ...orderData, buyer_id: u.id }).select().single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    if (!_sb) throw new Error('Supabase not initialised');
    const { data, error } = await _sb.from('orders').update({ status }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
};

// ──────────────────────────────────────────
//  CART
// ──────────────────────────────────────────
const SBCart = {
  async get() {
    if (!_sb) return [];
    const u = sbCurrentUser(); if (!u) return [];
    const { data, error } = await _sb.from('cart_items').select('*').eq('user_id', u.id);
    if (error) { console.warn('SBCart.get error:', error.message); return []; }
    return (data || []).map(i => ({
      productId: i.product_id,
      qty: i.qty,
      price: Number(i.price),
      title: i.title,
      image: i.image,
      vendorId: i.vendor_id,
    }));
  },

  async upsert(productId, qty, price, title, image, vendorId) {
    if (!_sb) return;
    const u = sbCurrentUser(); if (!u) return;
    const { error } = await _sb.from('cart_items').upsert(
      { user_id: u.id, product_id: productId, qty, price, title, image, vendor_id: vendorId },
      { onConflict: 'user_id,product_id' }
    );
    if (error) console.warn('SBCart.upsert error:', error.message);
  },

  async updateQty(productId, qty) {
    if (!_sb) return;
    const u = sbCurrentUser(); if (!u) return;
    await _sb.from('cart_items').update({ qty }).eq('user_id', u.id).eq('product_id', productId);
  },

  async remove(productId) {
    if (!_sb) return;
    const u = sbCurrentUser(); if (!u) return;
    await _sb.from('cart_items').delete().eq('user_id', u.id).eq('product_id', productId);
  },

  async clear() {
    if (!_sb) return;
    const u = sbCurrentUser(); if (!u) return;
    await _sb.from('cart_items').delete().eq('user_id', u.id);
  },
};

// ──────────────────────────────────────────
//  WISHLIST
// ──────────────────────────────────────────
const SBWishlist = {
  async get() {
    if (!_sb) return [];
    const u = sbCurrentUser(); if (!u) return [];
    const { data, error } = await _sb.from('wishlist').select('product_id').eq('user_id', u.id);
    if (error) { console.warn('SBWishlist.get error:', error.message); return []; }
    return (data || []).map(w => w.product_id);
  },

  async add(productId) {
    if (!_sb) return;
    const u = sbCurrentUser(); if (!u) return;
    await _sb.from('wishlist').insert({ user_id: u.id, product_id: productId });
  },

  async remove(productId) {
    if (!_sb) return;
    const u = sbCurrentUser(); if (!u) return;
    await _sb.from('wishlist').delete().eq('user_id', u.id).eq('product_id', productId);
  },
};

// ──────────────────────────────────────────
//  VENDOR REVIEWS
// ──────────────────────────────────────────
const SBReviews = {
  async forVendor(vendorId) {
    if (!_sb) return [];
    const { data, error } = await _sb.from('vendor_reviews').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    if (error) { console.warn('SBReviews.forVendor error:', error.message); return []; }
    return (data || []).map(r => ({ ...r, buyerName: r.buyer_name, createdAt: r.created_at }));
  },

  async submit(vendorId, rating, comment) {
    if (!_sb) throw new Error('Supabase not initialised');
    const u = sbCurrentUser(); if (!u) throw new Error('Login required');
    const { error } = await _sb.from('vendor_reviews').insert({
      vendor_id: vendorId,
      buyer_id: u.id,
      buyer_name: u.name,
      rating: Number(rating),
      comment,
    });
    if (error) throw error;
  },
};

// ──────────────────────────────────────────
//  PROFILES / ADMIN
// ──────────────────────────────────────────
const SBProfiles = {
  async get(id) {
    if (!_sb) return null;
    const { data, error } = await _sb.from('profiles').select('*').eq('id', id).single();
    if (error) { console.warn('SBProfiles.get error:', error.message); return null; }
    return data;
  },

  async update(id, updates) {
    if (!_sb) throw new Error('Supabase not initialised');
    const { data, error } = await _sb.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async allUsers() {
    if (!_sb) return [];
    const { data, error } = await _sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) { console.warn('SBProfiles.allUsers error:', error.message); return []; }
    return data || [];
  },

  async approveVendor(id) { return SBProfiles.update(id, { status: 'approved' }); },
  async suspend(id)        { return SBProfiles.update(id, { status: 'suspended' }); },
};

// ──────────────────────────────────────────
//  STORAGE: Product Image Upload
// ──────────────────────────────────────────
async function sbUploadProductImage(file, vendorId) {
  if (!_sb) throw new Error('Supabase not initialised');
  const ext  = (file.name || 'photo').split('.').pop() || 'jpg';
  const path = `${vendorId}/${Date.now()}.${ext}`;
  const { error } = await _sb.storage.from('product-images').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = _sb.storage.from('product-images').getPublicUrl(path);
  return publicUrl;
}

// ──────────────────────────────────────────
//  SUPPORT TICKETS
// ──────────────────────────────────────────
async function sbSubmitTicket(name, category, message) {
  if (!_sb) return;
  const u = sbCurrentUser();
  const { error } = await _sb.from('support_tickets').insert({ name, category, message, user_id: u?.id || null });
  if (error) console.warn('sbSubmitTicket error:', error.message);
}

// ──────────────────────────────────────────
//  INTERNAL HELPERS
// ──────────────────────────────────────────
function flattenProduct(p) {
  if (!p) return p;
  const vendor = p.profiles || {};
  return {
    id:          p.id,
    vendorId:    p.vendor_id,
    title:       p.title,
    description: p.description,
    price:       Number(p.price),
    category:    p.category,
    stock:       p.stock,
    images:      p.images || [],
    status:      p.status,
    rating:      Number(p.rating) || 4.5,
    reviews:     p.review_count || 0,
    createdAt:   p.created_at,
    vendor: {
      id:        vendor.id,
      storeName: vendor.store_name,
      location:  vendor.location,
      whatsapp:  vendor.whatsapp,
      status:    vendor.status,
    },
  };
}
