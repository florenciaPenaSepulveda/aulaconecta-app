import React, { useState } from 'react';
import { Text, TextInput, View, TouchableOpacity, Alert } from 'react-native';
import tw from 'twrnc';
import Spinner from 'react-native-loading-spinner-overlay';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types'; // Asegúrate de que este archivo exista y esté correctamente configurado

// Comenta las importaciones relacionadas con Apollo Client y GraphQL si no las necesitas
// import { useMutation } from '@apollo/client';
// import { FORGOT_PASS } from '../graphql/mutations/user';


const ForgotPass: React.FC = () => {
  const [email, setEmail] = useState('');
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // const [forgotPass, { loading, error }] = useMutation(FORGOT_PASS, {
  //   onCompleted: () => {
  //     Alert.alert('Éxito', 'Tu nueva contraseña fue enviada a tu correo', [
  //       {
  //         text: 'Ok',
  //         onPress: () => navigation.navigate('Login'),
  //       },
  //     ]);
  //   },
  //   onError: (e) => {
  //     console.log('Correo no encontrado', e);
  //     Alert.alert('Error', 'Correo no encontrado');
  //   },
  // });

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor, ingresa un correo válido.');
      return;
    }

    // Simular el proceso de envío de correo
    Alert.alert('Éxito', 'Tu nueva contraseña fue enviada a tu correo', [
      {
        text: 'Ok',
        onPress: () => navigation.navigate('Login'),
      },
    ]);

    // try {
    //   await forgotPass({
    //     variables: {
    //       email: email,
    //     },
    //   });
    // } catch (e) {
    //   console.log('Error al intentar recuperar la contraseña.');
    // }
  };

  return (
    <View style={tw`flex-1 bg-[#95D5B2] justify-center items-center`}>
      {/* {loading && (
        <Spinner visible={loading} textContent={'Cargando...'} textStyle={tw`text-white`} />
      )} */}
      <View style={tw`bg-[#1B4332] w-80 p-6 shadow-lg rounded-xl flex flex-col gap-4 justify-center`}>
        <Text style={tw`text-3xl text-white text-center font-semibold`}>Recuperar Contraseña</Text>
        <Text style={tw`text-white mt-4`}>Correo Electrónico:</Text>
        <TextInput
          style={tw`rounded-xl border w-full text-base px-3 py-2 bg-white`}
          placeholder="Ingresa tu Correo Electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          onPress={handleSubmit}
          style={tw`bg-[#95D5B2] rounded-xl mt-4 text-2xl py-2 justify-center items-center`}
        >
          <Text style={tw`text-white`}>Recuperar Contraseña</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ForgotPass;
