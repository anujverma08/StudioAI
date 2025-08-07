import React, { useEffect, useState } from 'react'
import { dummyCreationData } from '../assets/assets';
import { Sparkles, Gem } from 'lucide-react';
import { Protect } from '@clerk/clerk-react';
import CreationItems from '../components/CreationItems';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const Dashboard = () => {
  const [creation, setCreation] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const getDashboardData = async () => {
    try{
      const { data } = await axios.get('/api/user/get-user-creations', {
        headers: {
          'Authorization': `Bearer ${await getToken()}`
        }
      });
      if(data.success){
        setCreation(data.creations);
      }else{
        toast.error(data.message || 'Failed to fetch creations');
      }
    }catch(err){
      toast.error(err.message || 'Failed to fetch creations');
    }
    setLoading(false);
  }

  useEffect(() => {
    getDashboardData()
  }, []);
  return (
    <div className='h-full overflow-y-scroll p-6'>
      <div className='flex justify-start gap-4 flex-wrap'>
        <div className='flex justify-between items-center w-72 p-4 bg-white rounded-xl border border-gray-200 shadow-sm'>
          <div className='text-slate-600'>
            <p className=' text-sm'>Total Creations</p>
            <h2 className='text-xl font-semibold'>{creation.length}</h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center'>
            <Sparkles className='w-5 text-white' />

          </div>
        </div>
      {/* Active PLan card */}
        <div className='flex justify-between items-center w-72 p-4 bg-white rounded-xl border border-gray-200 shadow-sm'>
          <div className='text-slate-600'>
            <p className=' text-sm'>Active Plan</p>
            <h2 className='text-xl font-semibold'><Protect plan='premium_user' fallback="Free">Premium</Protect></h2>
          </div>
          <div className='w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center'>
            <Gem className='w-5 text-white' />

          </div>
        </div>

      </div>

      {
        loading ? (
          <div className='flex justify-center items-center h-3/4'>
            <span className='w-11 h-11 my-1 rounded-full border-3 border-purple-500 border-t-transparent animate-spin inline-block'></span>
            <p className='text-primary text-lg ml-2'>Loading...</p>  
          </div> 
        ) : (
          <div className='space-y-3'>
        <p className='mt-6 mb-4'>Recent Creations</p>
        {
          creation.map((item) => (
            <CreationItems key={item.id} item={item} />
          ))
        }
        <div>

        </div>
          </div>
      )
    }      
    </div>
  )
}

export default Dashboard