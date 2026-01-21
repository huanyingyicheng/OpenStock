'use client';

import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import InputField from "@/components/forms/InputField";
import SelectField from "@/components/forms/SelectField";
import {INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS} from "@/lib/constants";
import {CountrySelectField} from "@/components/forms/CountrySelectField";
import FooterLink from "@/components/forms/FooterLink";
import {signUpWithEmail} from "@/lib/actions/auth.actions";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import OpenDevSocietyBranding from "@/components/OpenDevSocietyBranding";
import React from "react";
import {useI18n} from "@/components/I18nProvider";
import AuthConfigNotice from "@/components/AuthConfigNotice";

const SignUp = () => {
    const router = useRouter()
    const { t } = useI18n();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<SignUpFormData>({
        defaultValues: {
            fullName: '',
            email: '',
            password: '',
            country: 'IN',
            investmentGoals: 'Growth',
            riskTolerance: 'Medium',
            preferredIndustry: 'Technology'
        },
        mode: 'onBlur'
    }, );

    const onSubmit = async (data: SignUpFormData) => {
        try {
            const result = await signUpWithEmail(data);
            if (result.success) {
                router.push('/');
                return;
            }
            toast.error(t('auth.signUp.failedTitle'), {
                description: result.error ?? t('auth.signUp.failedDefault'),
            });
        } catch (e) {
            console.error(e);
            toast.error(t('auth.signUp.failedTitle'), {
                description: e instanceof Error ? e.message : t('auth.signUp.failedDefault')
            })
        }
    }

    const investmentGoalsOptions = INVESTMENT_GOALS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }));
    const riskToleranceOptions = RISK_TOLERANCE_OPTIONS.map(({ value, labelKey }) => ({ value, label: t(labelKey) }));
    const preferredIndustriesOptions = PREFERRED_INDUSTRIES.map(({ value, labelKey }) => ({ value, label: t(labelKey) }));

    return (
        <>
            <AuthConfigNotice />
            <h1 className="form-title">{t('auth.signUp.title')}</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <InputField
                    name="fullName"
                    label={t('auth.signUp.fullName')}
                    placeholder={t('auth.signUp.fullNamePlaceholder')}
                    register={register}
                    error={errors.fullName}
                    validation={{ required: 'Full name is required', minLength: 2 }}
                />

                <InputField
                    name="email"
                    label={t('auth.signUp.email')}
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
                    label={t('auth.signUp.password')}
                    placeholder={t('auth.signUp.passwordPlaceholder')}
                    type="password"
                    register={register}
                    error={errors.password}
                    validation={{ required: 'Password is required', minLength: 8 }}
                />

                <CountrySelectField
                    name="country"
                    label={t('auth.signUp.country')}
                    control={control}
                    error={errors.country}
                    required
                />

                <SelectField
                    name="investmentGoals"
                    label={t('auth.signUp.investmentGoals')}
                    placeholder={t('auth.signUp.investmentGoals')}
                    options={investmentGoalsOptions}
                    control={control}
                    error={errors.investmentGoals}
                    required
                />

                <SelectField
                    name="riskTolerance"
                    label={t('auth.signUp.riskTolerance')}
                    placeholder={t('auth.signUp.riskTolerance')}
                    options={riskToleranceOptions}
                    control={control}
                    error={errors.riskTolerance}
                    required
                />

                <SelectField
                    name="preferredIndustry"
                    label={t('auth.signUp.preferredIndustry')}
                    placeholder={t('auth.signUp.preferredIndustry')}
                    options={preferredIndustriesOptions}
                    control={control}
                    error={errors.preferredIndustry}
                    required
                />

                <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
                    {isSubmitting ? t('auth.signUp.submitting') : t('auth.signUp.submit')}
                </Button>

                <FooterLink text={t('auth.signUp.alreadyHave')} linkText={t('auth.signUp.signIn')} href="/sign-in" />

                <OpenDevSocietyBranding outerClassName="mt-10 flex justify-center"/>
            </form>
        </>
    )
}
export default SignUp;
