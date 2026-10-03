const BASE=(process.env.NEXT_PUBLIC_API_URL||"http://localhost:5000/api").replace(/\/$/,"");
export async function api<T=any>(path:string,opt:RequestInit={}):Promise<T>{
 const token=typeof window!=="undefined"?localStorage.getItem("adminToken"):null;
 const h=new Headers(opt.headers);
 if(!(opt.body instanceof FormData)&&!h.has("Content-Type"))h.set("Content-Type","application/json");
 if(token)h.set("Authorization",`Bearer ${token}`);
 const r=await fetch(BASE+path,{...opt,headers:h,cache:"no-store"});
 const t=await r.text();let d:any={};try{d=t?JSON.parse(t):{}}catch{d={message:t}}
 if(!r.ok){if(r.status===401&&typeof window!=="undefined"){localStorage.removeItem("adminToken");localStorage.removeItem("adminUser")}throw new Error(d.message||"Request failed")}
 return d;
}
export const adminApi={
 login:(email:string,password:string)=>api("/admin/login",{method:"POST",body:JSON.stringify({email,password})}),
 me:()=>api("/admin/me"),dashboard:()=>api("/admin/dashboard"),
 users:(p:any={})=>{const q=new URLSearchParams({page:String(p.page||1),limit:String(p.limit||10)});if(p.search)q.set("search",p.search);if(p.status)q.set("status",p.status);return api("/admin/users?"+q)},
 user:(id:string)=>api("/admin/users/"+id),
 createUser:(p:any)=>api("/admin/users",{method:"POST",body:JSON.stringify(p)}),
 updateUser:(id:string,p:any)=>api("/admin/users/"+id,{method:"PUT",body:JSON.stringify(p)}),
 deleteUser:(id:string)=>api("/admin/users/"+id,{method:"DELETE"}),
 policy:(id:string)=>api("/admin/users/"+id+"/policy"),
 uploadPolicy:(id:string,f:File)=>{const x=new FormData();x.append("policy",f);return api("/admin/users/"+id+"/policy",{method:"POST",body:x})},
 deletePolicy:(id:string)=>api("/admin/users/"+id+"/policy",{method:"DELETE"}),
 cards:(id:string)=>api("/admin/users/"+id+"/scratch-cards"),
 /* ================================================= */
/* BANNERS */
/* ================================================= */

banners: () =>
  api("/banners/admin"),

createBanner: (data: {
  image: File;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaType?: "none" | "auth" | "external";
  ctaValue?: string;
  order?: number;
  isActive?: boolean;
}) => {
  const form = new FormData();

  form.append("image", data.image);

  if (data.title !== undefined) {
    form.append("title", data.title);
  }

  if (data.subtitle !== undefined) {
    form.append("subtitle", data.subtitle);
  }

  if (data.ctaText !== undefined) {
    form.append("ctaText", data.ctaText);
  }

  if (data.ctaType !== undefined) {
    form.append("ctaType", data.ctaType);
  }

  if (data.ctaValue !== undefined) {
    form.append("ctaValue", data.ctaValue);
  }

  form.append("order", String(data.order ?? 0));
  form.append("isActive", String(data.isActive ?? true));

  return api("/banners", {
    method: "POST",
    body: form,
  });
},

updateBanner: (
  id: string,
  data: {
    image?: File;
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaType?: "none" | "auth" | "external";
    ctaValue?: string;
    order?: number;
    isActive?: boolean;
  }
) => {
  const form = new FormData();

  if (data.image) {
    form.append("image", data.image);
  }

  if (data.title !== undefined) {
    form.append("title", data.title);
  }

  if (data.subtitle !== undefined) {
    form.append("subtitle", data.subtitle);
  }

  if (data.ctaText !== undefined) {
    form.append("ctaText", data.ctaText);
  }

  if (data.ctaType !== undefined) {
    form.append("ctaType", data.ctaType);
  }

  if (data.ctaValue !== undefined) {
    form.append("ctaValue", data.ctaValue);
  }

  if (data.order !== undefined) {
    form.append("order", String(data.order));
  }

  if (data.isActive !== undefined) {
    form.append("isActive", String(data.isActive));
  }

  return api(`/banners/${id}`, {
    method: "PUT",
    body: form,
  });
},

toggleBanner: (id: string) =>
  api(`/banners/${id}/toggle`, {
    method: "PATCH",
  }),

deleteBanner: (id: string) =>
  api(`/banners/${id}`, {
    method: "DELETE",
  }),
 issue:(id:string,amount:number)=>api("/admin/users/"+id+"/scratch-card",{method:"POST",body:JSON.stringify({amount,currency:"INR"})})
};

