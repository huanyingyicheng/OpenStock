'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import InputField from '@/components/forms/InputField';
import FooterLink from '@/components/forms/FooterLink';
import {signInWithEmail} from "@/lib/actions/auth.actions";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";
import {useI18n} from "@/components/I18nProvider";
import AuthConfigNotice from "@/components/AuthConfigNotice";

const SignIn = () => {
    const router = useRouter()
    const { t } = useI18n();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<SignInFormData>({
        defaultValues: {
            email: '',
            password: '',
        },
        mode: 'onBlur',
    });

    const onSubmit = async (data: SignInFormData) => {
        try {
            const result = await signInWithEmail(data);
            if (result.success) {
                router.push('/');
                return;
            }
            toast.error(t('auth.signIn.failedTitle'), {
                description: result.error ?? t('auth.signIn.failedDefault'),
            });
        } catch (e) {
            console.error(e);
            toast.error(t('auth.signIn.failedTitle'), {
                description: e instanceof Error ? e.message : t('auth.signIn.failedDefault')
            })
        }
    }

    return (
        <>
            <AuthConfigNotice />
            <h1 className="form-title">{t('auth.signIn.title')}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="email"
                    label={t('auth.signIn.email')}
                    placeholder={t('auth.signIn.emailPlaceholder')}
                    register={register}
                    error={errors.email}
                    validation={{
                      required: 'Email is required',
                      pattern: {
                        value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/,
                        message: 'Please enter a valid email address'
                      }
                    }}
                />

                <InputField
                    name="password"
                    label={t('auth.signIn.password')}
                    placeholder={t('auth.signIn.passwordPlaceholder')}
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? t('auth.signIn.submitting') : t('auth.signIn.submit')}
                </Button>

                <FooterLink
                    text={t('auth.signIn.noAccount')}
                    linkText={t('auth.signIn.createAccount')}
                    href="/sign-up"
                />
                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center"/>
            </form>
        </>
    );
};
export default SignIn;
