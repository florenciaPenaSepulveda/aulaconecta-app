import React, { useState } from 'react';
import { Text, TextInput, View, TouchableOpacity, Alert, Platform } from 'react-native';
import tw from 'twrnc';
import Spinner from 'react-native-loading-spinner-overlay'; 
// Solo importar toast si estás en la web
let toast: any;
if (Platform.OS === 'web') {
  toast = require('react-toastify').toast;
  require('react-toastify/dist/ReactToastify.css'); // Asegúrate de que los estilos de toastify solo se importen en la web
}

const Login: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  

const handleLogin = (email: string, password: string) => {
  const defaultEmail = 'cristian@gmail.com';
  const defaultPassword = '123456789';

  setLoading(true);

  if (email === defaultEmail && password === defaultPassword) {
    setLoading(false);
    
    if (Platform.OS === 'web') {
      // Mostrar toast si es web
      toast.success('¡Éxito! Inicio de Sesión correcto');
    } else {
      // Mostrar Alert si es móvil
      Alert.alert('¡Éxito!', 'Inicio de Sesión correcto', [
        {
          text: 'Ok',
          onPress: () => navigation.navigate('HomeLogin'),
        },
      ]);
    }
    
  } else {
    setLoading(false);

    if (Platform.OS === 'web') {
      toast.error('Error: Email o contraseña incorrectos');
    } else {
      Alert.alert('Error', 'Email o contraseña incorrectos');
    }
  }
};


  const handleSubmit = () => {
    if (email.trim() === '' || pass.trim() === '') {
      Alert.alert('Error', 'Por favor, llena ambos campos');
      return;
    }
    console.log('Email:', email, 'Password:', pass); // Verifica los datos ingresados
    handleLogin(email, pass);
  };


  return (
    <View style={tw`flex-1 bg-[#95D5B2] justify-center items-center`}>
      <Spinner visible={loading} textContent={'Cargando...'} textStyle={tw`text-white`} />
      
      <View style={tw`bg-[#1B4332] w-80 p-6 shadow-lg rounded-xl flex flex-col gap-4 justify-center`}>
        <Text style={tw`bg-[#1B4332] text-white text-center text-5xl font-bold py-4 rounded-xl`}>
        CloseIA
      </Text>
        <Text style={tw`text-3xl text-white text-center underline font-semibold`}>Login</Text>

        <Text style={tw`text-white`}>Email:</Text>
        <TextInput
          style={tw`rounded-xl border w-full text-base px-3 py-2 bg-white`}
          placeholder="Ingresa tu Correo"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={tw`text-white mt-4`}>Contraseña:</Text>
        <TextInput
          style={tw`rounded-xl border w-full text-base px-3 py-2 bg-white`}
          placeholder="Ingresa tu Contraseña"
          value={pass}
          onChangeText={setPass}
          secureTextEntry
        />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPass')}>
          <Text style={tw`text-white mt-2`}>
            Olvidé la contraseña. <Text style={tw`text-[#95D5B2]`}>Recuperar</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
        onPress={handleSubmit}
        style={tw`bg-green-500 rounded-xl mt-4 text-2xl py-2 justify-center items-center`}
        disabled={loading}>
        <Text style={tw`text-white`}>{loading ? 'Cargando...' : 'Iniciar Sesión'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={tw`text-white mt-4`}>
            No tienes cuenta? <Text style={tw`text-[#95D5B2]`}>Regístrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Login;
