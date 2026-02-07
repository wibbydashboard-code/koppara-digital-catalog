
import { supabase } from './supabase';

export async function loginConEmail(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function loginConTelefono(telefono: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: telefono
  });
  if (error) throw error;
  return data;
}

export async function obtenerUsuarioActual() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
