# data_processor.py

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Union, Tuple, Optional
import logging
import re
from decimal import Decimal
import scipy.stats as stats

# Configuration du logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self):
        self.overall_data = None
        self.transaction_data = None
        
    def clean_revenue(self, value: str) -> float:
        """Nettoie et convertit les valeurs de revenus en float."""
        if pd.isna(value) or value == '':
            return 0.0
        
        if isinstance(value, (int, float)):
            return float(value)
        
        # Supprime tous les symboles monétaires et caractères non numériques sauf . et -
        cleaned = re.sub(r'[^\d.-]', '', str(value))
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def clean_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """Nettoie et prépare le dataframe."""
        try:
            # Copie pour éviter de modifier l'original
            df = df.copy()
            
            # Convertit les colonnes de revenus si elles existent
            revenue_columns = [col for col in df.columns if 'revenue' in str(col).lower()]
            for col in revenue_columns:
                df[col] = df[col].apply(self.clean_revenue)
                
            # Remplace les valeurs nulles par des valeurs appropriées selon le type
            for column in df.columns:
                if df[column].dtype == 'object':
                    df[column].fillna('', inplace=True)
                else:
                    df[column].fillna(0, inplace=True)
                    
            return df
        except Exception as e:
            logger.error(f"Erreur lors du nettoyage du DataFrame: {str(e)}")
            raise

    def process_data(self, overall_data: List[Dict[str, Any]], transaction_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Traite les données des deux fichiers."""
        try:
            # Vérification des données
            if not overall_data:
                raise ValueError("Les données overall_data sont vides")
            
            # Conversion en DataFrames
            overall_df = pd.DataFrame(overall_data)
            transaction_df = pd.DataFrame(transaction_data if transaction_data else [])
            
            logger.info("Colonnes overall: %s", overall_df.columns.tolist())
            logger.info("Types de données overall: %s", overall_df.dtypes.to_dict())
            
            # Nettoyage des données
            overall_df = self.clean_dataframe(overall_df)
            if not transaction_df.empty:
                transaction_df = self.clean_dataframe(transaction_df)
            
            # Stockage des données traitées
            self.overall_data = overall_df
            self.transaction_data = transaction_df
            
            # Préparation de la réponse
            response = {
                'raw_data': {
                    'overall': overall_df.to_dict('records'),
                    'transaction': transaction_df.to_dict('records') if not transaction_df.empty else []
                },
                'summary': {
                    'overall_rows': len(overall_df),
                    'transaction_rows': len(transaction_df),
                    'columns_overall': list(overall_df.columns),
                    'columns_transaction': list(transaction_df.columns) if not transaction_df.empty else []
                }
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement des données: {str(e)}")
            raise

    def aggregate_transactions(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        try:
            # Conversion en DataFrame
            df = pd.DataFrame(data)
            if df.empty:
                logger.warning("Aucune donnée à agréger")
                return []

            # Convertir les colonnes numériques en type numérique
            df['quantity'] = pd.to_numeric(df['quantity'], errors='coerce')
            df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce')

            # Créer une colonne pour le nombre de produits uniques
            df['unique_products'] = 1

            # Définir les colonnes à garder la première valeur
            first_value_columns = ['variation', 'device_category']
            
            # Définir les colonnes à concaténer (uniquement celles qui existent)
            available_concat_columns = []
            optional_columns = ['item_category2', 'item_name', 'item_bundle', 'item_name_simple']
            for col in optional_columns:
                if col in df.columns:
                    available_concat_columns.append(col)

            # Créer le dictionnaire d'agrégation avec les colonnes disponibles
            agg_dict = {
                'revenue': 'sum',
                'quantity': 'sum',
                'unique_products': 'count'  # Compte le nombre de produits uniques
            }

            # Ajouter les colonnes de première valeur si elles existent
            for col in first_value_columns:
                if col in df.columns:
                    agg_dict[col] = 'first'

            # Ajouter les colonnes à concaténer si elles existent
            for col in available_concat_columns:
                agg_dict[col] = lambda x: self._limit_concatenated_items(x)

            # Grouper par transaction_id
            grouped = df.groupby('transaction_id').agg(agg_dict).reset_index()

            # Ajouter une colonne pour afficher le nombre total de produits
            grouped['products_summary'] = grouped.apply(
                lambda row: f"{int(row['unique_products'])} produit{'s' if row['unique_products'] > 1 else ''} ({int(row['quantity'])} unité{'s' if row['quantity'] > 1 else ''})", 
                axis=1
            )

            # Arrondir les valeurs numériques
            grouped['revenue'] = grouped['revenue'].round(2)
            
            # Nettoyer le résultat final
            result = grouped.to_dict('records')
            
            # Log pour debugging
            logger.info(f"Transaction agrégée exemple: {result[0] if result else 'Aucun résultat'}")
            
            return result

        except Exception as e:
            logger.error(f"Erreur lors de l'agrégation des transactions: {str(e)}", exc_info=True)
            raise

    def _limit_concatenated_items(self, items, max_items: int = 3) -> str:
        """
        Limite le nombre d'éléments concaténés et ajoute un compteur si nécessaire.
        
        Args:
            items: Série de valeurs à concaténer
            max_items: Nombre maximum d'éléments à afficher
            
        Returns:
            str: Chaîne concaténée avec compteur si nécessaire
        """
        try:
            # Filtrer les valeurs non nulles et uniques
            unique_items = sorted(set(str(i) for i in items if pd.notna(i) and str(i).strip()))
            
            # Si le nombre d'éléments est inférieur ou égal à max_items, retourner tous les éléments
            if len(unique_items) <= max_items:
                return ' | '.join(unique_items)
            
            # Sinon, retourner les premiers éléments avec un compteur
            return f"{' | '.join(unique_items[:max_items])} (+{len(unique_items) - max_items} autres)"
            
        except Exception as e:
            logger.error(f"Erreur lors de la limitation des éléments concaténés: {str(e)}")
            return ""

    def calculate_uplift_and_confidence(
        self, 
        control_data: List[float], 
        variation_data: List[float],
        metric_type: str = 'normal'
    ) -> Tuple[float, float]:
        """
        Calcule l'uplift et le niveau de confiance pour une variation vs contrôle.
        
        Args:
            control_data: Données du groupe contrôle
            variation_data: Données de la variation
            metric_type: Type de métrique ('normal' ou 'revenue')
            
        Returns:
            Tuple[float, float]: (uplift en pourcentage, niveau de confiance)
        """
        if not control_data or not variation_data:
            return 0.0, 0.0

        # Calcul de l'uplift
        control_mean = np.mean(control_data)
        variation_mean = np.mean(variation_data)
        
        uplift = ((variation_mean - control_mean) / control_mean) * 100 if control_mean != 0 else 0

        # Calcul du niveau de confiance
        if metric_type == 'revenue':
            # Test de Mann-Whitney U pour les revenus
            _, p_value = stats.mannwhitneyu(
                variation_data, 
                control_data, 
                alternative='two-sided'
            )
        else:
            # Test t pour les métriques normales
            _, p_value = stats.ttest_ind(
                variation_data,
                control_data,
                equal_var=False  # Test de Welch pour variance inégale
            )

        confidence = (1 - p_value) * 100
        
        return round(uplift, 2), round(confidence, 2)

    def _validate_input_data(self, data: Dict[str, Any]) -> None:
        """Valide la structure des données d'entrée"""
        if not data.get('raw_data'):
            raise ValueError("Missing raw_data in input")
        if not data['raw_data'].get('transaction'):
            raise ValueError("Missing transaction data")
        if not data['raw_data'].get('overall'):
            raise ValueError("Missing overall data")

    def calculate_overview_metrics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            self._validate_input_data(data)
            
            # Créer la table virtuelle
            virtual_table = self.create_analysis_table(data)
            overall_df = pd.DataFrame(data['raw_data']['overall'])

            # Identifier le contrôle
            control_variation = str(overall_df[overall_df['variation'].str.contains('control', case=False)]['variation'].iloc[0])

            metrics_by_variation = {}
            for variation in overall_df['variation'].unique():
                # Filtrer les données pour cette variation
                var_data = virtual_table[virtual_table['variation'] == variation]
                ctrl_data = virtual_table[virtual_table['variation'] == control_variation]
                
                # Données overall pour cette variation
                var_overall = overall_df[overall_df['variation'] == variation].iloc[0]
                ctrl_overall = overall_df[overall_df['variation'] == control_variation].iloc[0]

                # Calculer les métriques
                metrics = {
                    'users': {
                        'value': float(var_overall['users']),
                        'control_value': float(ctrl_overall['users']),
                        'uplift': ((float(var_overall['users']) - float(ctrl_overall['users'])) / float(ctrl_overall['users'])) * 100
                    },
                    'add_to_cart_rate': {
                        'value': (float(var_overall['user_add_to_carts']) / float(var_overall['users'])) * 100,
                        'control_value': (float(ctrl_overall['user_add_to_carts']) / float(ctrl_overall['users'])) * 100,
                        'uplift': (((float(var_overall['user_add_to_carts']) / float(var_overall['users'])) - 
                                  (float(ctrl_overall['user_add_to_carts']) / float(ctrl_overall['users']))) / 
                                 (float(ctrl_overall['user_add_to_carts']) / float(ctrl_overall['users']))) * 100,
                        'confidence': self._calculate_add_to_cart_confidence(
                            float(var_overall['user_add_to_carts']), 
                            float(var_overall['users']),
                            float(ctrl_overall['user_add_to_carts']), 
                            float(ctrl_overall['users'])
                        ),
                        'confidence_interval': self._calculate_add_to_cart_confidence_interval(
                            float(var_overall['user_add_to_carts']), 
                            float(var_overall['users']),
                            float(ctrl_overall['user_add_to_carts']), 
                            float(ctrl_overall['users'])
                        ),
                        'details': {
                            'variation': {
                                'count': int(float(var_overall['user_add_to_carts'])),
                                'total': int(float(var_overall['users'])),
                                'rate': (float(var_overall['user_add_to_carts']) / float(var_overall['users'])) * 100,
                                'unit': 'percentage'
                            },
                            'control': {
                                'count': int(float(ctrl_overall['user_add_to_carts'])),
                                'total': int(float(ctrl_overall['users'])), 
                                'rate': (float(ctrl_overall['user_add_to_carts']) / float(ctrl_overall['users'])) * 100,
                                'unit': 'percentage'
                            }
                        }
                    },
                    'transaction_rate': self._calculate_transaction_rate(var_data, ctrl_data, var_overall, ctrl_overall),
                    'total_revenue': self._calculate_total_revenue(var_data, ctrl_data)
                }

                metrics = self._convert_numpy_types(metrics)
                metrics_by_variation[str(variation)] = metrics

            return {
                'success': True,
                'data': metrics_by_variation,
                'control': control_variation,
                'virtual_table': virtual_table.to_dict('records')
            }

        except Exception as e:
            logger.error(f"Error calculating overview metrics: {str(e)}")
            return {'success': False, 'error': str(e)}

    def calculate_confidence(self, control_data: np.array, variation_data: np.array, metric_type: str = 'normal') -> float:
        """
        Calcule le niveau de confiance statistique.
        
        Args:
            control_data: Données du groupe contrôle
            variation_data: Données de la variation
            metric_type: 'normal' pour test t, 'revenue' pour Mann-Whitney U
            
        Returns:
            float: Niveau de confiance en pourcentage
        """
        try:
            if len(control_data) < 2 or len(variation_data) < 2:
                return 0.0
            
            if metric_type == 'revenue':
                # Test de Mann-Whitney U pour les revenus
                _, p_value = stats.mannwhitneyu(
                    variation_data,
                    control_data,
                    alternative='two-sided'
                )
            else:
                # Test t pour les métriques normales
                _, p_value = stats.ttest_ind(
                    variation_data,
                    control_data,
                    equal_var=False  # Test de Welch pour variance inégale
                )
            
            confidence = (1 - p_value) * 100
            return round(confidence, 2)
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 0.0

    def calculate_revenue_metrics(self, data: Dict[str, Any]) -> Dict[str, Any]:
        try:
            self._validate_input_data(data)
            
            # Créer la table virtuelle
            virtual_table = self.create_analysis_table(data)
            overall_df = pd.DataFrame(data['raw_data']['overall'])

            # Identifier le contrôle
            control_variation = str(overall_df[overall_df['variation'].str.contains('control', case=False)]['variation'].iloc[0])

            metrics_by_variation = {}
            for variation in overall_df['variation'].unique():
                var_data = virtual_table[virtual_table['variation'] == variation]
                ctrl_data = virtual_table[virtual_table['variation'] == control_variation]
                
                var_overall = overall_df[overall_df['variation'] == variation].iloc[0]
                ctrl_overall = overall_df[overall_df['variation'] == control_variation].iloc[0]

                metrics = {
                    'users': {
                        'value': float(var_overall['users']),
                        'control_value': float(ctrl_overall['users'])
                        # Pas d'uplift ni de confidence pour users
                    },
                    'transaction_rate': self._calculate_transaction_rate(var_data, ctrl_data, var_overall, ctrl_overall),
                    'aov': self._calculate_aov(var_data, ctrl_data),
                    'avg_products': self._calculate_avg_products(var_data, ctrl_data),
                    'total_revenue': self._calculate_total_revenue(var_data, ctrl_data),
                    'arpu': self._calculate_arpu(var_data, ctrl_data, var_overall, ctrl_overall)
                }

                metrics = self._convert_numpy_types(metrics)
                metrics_by_variation[str(variation)] = metrics

            return {
                'success': True,
                'data': metrics_by_variation,
                'control': control_variation,
                'virtual_table': virtual_table.to_dict('records')
            }

        except Exception as e:
            logger.error(f"Error calculating revenue metrics: {str(e)}")
            return {'success': False, 'error': str(e)}

    def _calculate_transaction_rate(self, var_data: pd.DataFrame, ctrl_data: pd.DataFrame, var_overall: pd.Series, ctrl_overall: pd.Series) -> Dict:
        """Calcule le taux de conversion avec le test exact de Fisher"""
        try:
            # Calcul des taux de conversion
            var_trans = len(var_data)
            ctrl_trans = len(ctrl_data)
            var_users = float(var_overall['users'])
            ctrl_users = float(ctrl_overall['users'])
            
            var_rate = (var_trans / var_users) * 100 if var_users > 0 else 0
            ctrl_rate = (ctrl_trans / ctrl_users) * 100 if ctrl_users > 0 else 0

            # Test exact de Fisher
            contingency_table = [
                [var_trans, int(var_users - var_trans)],  # [succès, échecs] variation
                [ctrl_trans, int(ctrl_users - ctrl_trans)] # [succès, échecs] contrôle
            ]
            _, p_value = stats.fisher_exact(contingency_table)
            confidence = (1 - p_value) * 100

            # Calculer l'intervalle de confiance
            confidence_interval = self._calculate_transaction_rate_confidence_interval(
                var_trans,
                var_users,
                ctrl_trans,
                ctrl_users
            )

            return {
                'value': var_rate,
                'control_value': ctrl_rate,
                'uplift': ((var_rate - ctrl_rate) / ctrl_rate) * 100 if ctrl_rate > 0 else 0,
                'confidence': round(confidence, 2),
                'confidence_interval': confidence_interval,
                'details': {
                    'variation': {
                        'count': var_trans,
                        'total': int(var_users),
                        'rate': round(var_rate, 2),
                        'unit': 'percentage'
                    },
                    'control': {
                        'count': ctrl_trans,
                        'total': int(ctrl_users),
                        'rate': round(ctrl_rate, 2),
                        'unit': 'percentage'
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error calculating transaction rate: {str(e)}")
            return self._get_default_metric_result()

    def _calculate_aov(self, var_data: pd.DataFrame, ctrl_data: pd.DataFrame) -> Dict:
        """Calcule l'AOV avec le test de Mann-Whitney U"""
        try:
            # Calcul des AOV par transaction
            var_aovs = var_data['revenue'].values  # Valeurs individuelles des transactions
            ctrl_aovs = ctrl_data['revenue'].values  # Valeurs individuelles des transactions
            
            var_aov = np.mean(var_aovs) if len(var_aovs) > 0 else 0
            ctrl_aov = np.mean(ctrl_aovs) if len(ctrl_aovs) > 0 else 0

            # Test de Mann-Whitney U pour la confiance
            _, p_value = stats.mannwhitneyu(
                var_aovs,
                ctrl_aovs,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100

            # Bootstrap pour l'intervalle de confiance
            n_bootstrap = 1000
            diffs = []
            
            for _ in range(n_bootstrap):
                # Échantillonnage avec remplacement des transactions individuelles
                var_sample = np.random.choice(var_aovs, size=len(var_aovs), replace=True)
                ctrl_sample = np.random.choice(ctrl_aovs, size=len(var_aovs), replace=True)
                
                # Calculer les moyennes des échantillons
                var_sample_mean = np.mean(var_sample)
                ctrl_sample_mean = np.mean(ctrl_sample)
                
                # Calculer la différence relative en pourcentage
                diff_pct = ((var_sample_mean - ctrl_sample_mean) / ctrl_sample_mean) * 100 if ctrl_sample_mean != 0 else 0
                diffs.append(diff_pct)

            # Calculer les percentiles pour l'intervalle de confiance
            lower = np.percentile(diffs, 2.5)
            upper = np.percentile(diffs, 97.5)

            return {
                'value': var_aov,
                'control_value': ctrl_aov,
                'uplift': ((var_aov - ctrl_aov) / ctrl_aov) * 100 if ctrl_aov > 0 else 0,
                'confidence': round(confidence, 2),
                'confidence_interval': {'lower': round(lower, 2), 'upper': round(upper, 2)},
                'details': {
                    'variation': {
                        'count': len(var_aovs),
                        'total': var_data['revenue'].sum(),
                        'rate': round(var_aov, 2),
                        'unit': 'currency'
                    },
                    'control': {
                        'count': len(ctrl_aovs),
                        'total': ctrl_data['revenue'].sum(),
                        'rate': round(ctrl_aov, 2),
                        'unit': 'currency'
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error calculating AOV: {str(e)}")
            return self._get_default_metric_result()

    def _calculate_avg_products(self, var_data: pd.DataFrame, ctrl_data: pd.DataFrame) -> Dict:
        """
        Calcule la moyenne des produits avec le test de Mann-Whitney U
        """
        try:
            var_quantities = var_data['quantity'].values
            ctrl_quantities = ctrl_data['quantity'].values
            
            var_avg = np.mean(var_quantities) if len(var_quantities) > 0 else 0
            ctrl_avg = np.mean(ctrl_quantities) if len(ctrl_quantities) > 0 else 0

            # Test de Mann-Whitney U
            _, p_value = stats.mannwhitneyu(
                var_quantities,
                ctrl_quantities,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100

            # Bootstrap pour l'intervalle de confiance
            n_bootstrap = 1000
            diffs = []
            for _ in range(n_bootstrap):
                var_sample = np.random.choice(var_quantities, size=len(var_quantities), replace=True)
                ctrl_sample = np.random.choice(ctrl_quantities, size=len(ctrl_quantities), replace=True)
                diff_pct = ((np.mean(var_sample) - np.mean(ctrl_sample)) / np.mean(ctrl_sample)) * 100
                diffs.append(diff_pct)
            
            lower = np.percentile(diffs, 2.5)
            upper = np.percentile(diffs, 97.5)

            return {
                'value': var_avg,
                'control_value': ctrl_avg,
                'uplift': ((var_avg - ctrl_avg) / ctrl_avg) * 100 if ctrl_avg > 0 else 0,
                'confidence': round(confidence, 2),
                'confidence_interval': {'lower': round(lower, 2), 'upper': round(upper, 2)},
                'details': {
                    'variation': {
                        'count': len(var_quantities),
                        'total': int(np.sum(var_quantities)),
                        'rate': round(var_avg, 2),
                        'unit': 'quantity'
                    },
                    'control': {
                        'count': len(ctrl_quantities),
                        'total': int(np.sum(ctrl_quantities)),
                        'rate': round(ctrl_avg, 2),
                        'unit': 'quantity'
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error calculating avg products metrics: {str(e)}")
            return {
                'value': 0,
                'control_value': 0,
                'uplift': 0,
                'confidence': 0,
                'confidence_interval': {'lower': 0, 'upper': 0},
                'details': {
                    'variation': {'count': 0, 'total': 0, 'rate': 0},
                    'control': {'count': 0, 'total': 0, 'rate': 0}
                }
            }

    def _calculate_total_revenue(self, var_data: pd.DataFrame, ctrl_data: pd.DataFrame) -> Dict:
        """Calcule le revenu total avec Mann-Whitney U test"""
        try:
            # Calculer les revenus totaux
            var_revenue = var_data['revenue'].sum()
            ctrl_revenue = ctrl_data['revenue'].sum()
            
            # Test de Mann-Whitney U pour la confiance
            _, p_value = stats.mannwhitneyu(
                var_data['revenue'].values,
                ctrl_data['revenue'].values,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100

            # Calculer l'intervalle de confiance avec la méthode de Mann-Whitney U
            # Utiliser la différence relative des distributions
            var_values = var_data['revenue'].values
            ctrl_values = ctrl_data['revenue'].values
            
            # Calculer les rangs moyens
            var_ranks = stats.rankdata(np.concatenate([var_values, ctrl_values]))[:len(var_values)]
            ctrl_ranks = stats.rankdata(np.concatenate([var_values, ctrl_values]))[len(var_values):]
            
            # Calculer l'erreur standard
            n1, n2 = len(var_values), len(ctrl_values)
            se = np.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12)
            
            # Calculer l'intervalle de confiance (95%)
            z = 1.96
            margin = z * se
            
            # Convertir en différence relative
            diff = ((var_revenue - ctrl_revenue) / ctrl_revenue) * 100 if ctrl_revenue > 0 else 0
            margin_pct = (margin / ctrl_revenue) * 100 if ctrl_revenue > 0 else 0

            return {
                'value': var_revenue,
                'control_value': ctrl_revenue,
                'uplift': diff,
                'confidence': round(confidence, 2),
                'confidence_interval': {
                    'lower': round(diff - margin_pct, 2),
                    'upper': round(diff + margin_pct, 2)
                },
                'details': {
                    'variation': {
                        'count': len(var_data),
                        'total': var_revenue,
                        'rate': var_revenue,  # Pour le revenu total, rate = total
                        'unit': 'currency'
                    },
                    'control': {
                        'count': len(ctrl_data),
                        'total': ctrl_revenue,
                        'rate': ctrl_revenue,  # Pour le revenu total, rate = total
                        'unit': 'currency'
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error calculating total revenue: {str(e)}")
            return self._get_default_metric_result()

    def _calculate_arpu(self, var_data: pd.DataFrame, ctrl_data: pd.DataFrame, var_overall: pd.Series, ctrl_overall: pd.Series) -> Dict:
        """Calcule l'ARPU (Average Revenue Per User) avec Mann-Whitney U test"""
        try:
            # Calculer l'ARPU
            var_revenue = var_data['revenue'].sum()
            ctrl_revenue = ctrl_data['revenue'].sum()
            var_users = float(var_overall['users'])
            ctrl_users = float(ctrl_overall['users'])
            
            var_arpu = var_revenue / var_users if var_users > 0 else 0
            ctrl_arpu = ctrl_revenue / ctrl_users if ctrl_users > 0 else 0

            # Test de Mann-Whitney U pour la confiance
            _, p_value = stats.mannwhitneyu(
                var_data['revenue'].values,
                ctrl_data['revenue'].values,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100

            # Bootstrap pour l'intervalle de confiance
            n_bootstrap = 1000
            diffs = []
            
            for _ in range(n_bootstrap):
                # Échantillonnage avec remplacement des revenus
                var_sample = np.random.choice(var_data['revenue'].values, size=len(var_data), replace=True)
                ctrl_sample = np.random.choice(ctrl_data['revenue'].values, size=len(ctrl_data), replace=True)
                
                # Calculer l'ARPU pour chaque échantillon
                var_sample_arpu = np.sum(var_sample) / var_users
                ctrl_sample_arpu = np.sum(ctrl_sample) / ctrl_users
                
                # Calculer la différence relative en pourcentage
                diff_pct = ((var_sample_arpu - ctrl_sample_arpu) / ctrl_sample_arpu) * 100 if ctrl_sample_arpu != 0 else 0
                diffs.append(diff_pct)

            # Calculer les percentiles pour l'intervalle de confiance
            lower = np.percentile(diffs, 2.5)
            upper = np.percentile(diffs, 97.5)

            return {
                'value': var_arpu,
                'control_value': ctrl_arpu,
                'uplift': ((var_arpu - ctrl_arpu) / ctrl_arpu) * 100 if ctrl_arpu > 0 else 0,
                'confidence': round(confidence, 2),
                'confidence_interval': {'lower': round(lower, 2), 'upper': round(upper, 2)},
                'details': {
                    'variation': {
                        'count': int(var_users),
                        'total': var_revenue,
                        'rate': round(var_arpu, 2),
                        'unit': 'currency'
                    },
                    'control': {
                        'count': int(ctrl_users),
                        'total': ctrl_revenue,
                        'rate': round(ctrl_arpu, 2),
                        'unit': 'currency'
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error calculating ARPU: {str(e)}")
            return self._get_default_metric_result()

    def validate_transaction_data(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Valide la cohérence des données de transaction.
        """
        try:
            validation_results = {
                'is_valid': True,
                'warnings': [],
                'stats': {}
            }

            df = pd.DataFrame(data)
            
            # Statistiques de base
            validation_results['stats'] = {
                'total_transactions': len(df['transaction_id'].unique()),
                'total_records': len(df),
                'avg_items_per_transaction': len(df) / len(df['transaction_id'].unique()),
                'revenue_range': {
                    'min': df['revenue'].min(),
                    'max': df['revenue'].max(),
                    'mean': df['revenue'].mean()
                },
                'quantity_range': {
                    'min': df['quantity'].min(),
                    'max': df['quantity'].max(),
                    'mean': df['quantity'].mean()
                }
            }

            # Vérifications de cohérence
            # 1. Revenus négatifs
            negative_revenue = df[df['revenue'] < 0]
            if not negative_revenue.empty:
                validation_results['warnings'].append({
                    'type': 'negative_revenue',
                    'count': len(negative_revenue),
                    'sample': negative_revenue.head(2).to_dict('records')
                })

            # 2. Quantités nulles ou négatives
            invalid_quantity = df[df['quantity'] <= 0]
            if not invalid_quantity.empty:
                validation_results['warnings'].append({
                    'type': 'invalid_quantity',
                    'count': len(invalid_quantity),
                    'sample': invalid_quantity.head(2).to_dict('records')
                })

            # 3. Variations manquantes
            missing_variation = df[df['variation'].isna()]
            if not missing_variation.empty:
                validation_results['warnings'].append({
                    'type': 'missing_variation',
                    'count': len(missing_variation),
                    'sample': missing_variation.head(2).to_dict('records')
                })

            return validation_results

        except Exception as e:
            logger.error(f"Erreur lors de la validation des données: {str(e)}")
            return {
                'is_valid': False,
                'error': str(e)
            }

    def create_analysis_table(self, data: Dict[str, Any]) -> pd.DataFrame:
        try:
            transaction_df = pd.DataFrame(data.get('raw_data', {}).get('transaction', []))
            overall_df = pd.DataFrame(data.get('raw_data', {}).get('overall', []))
            
            if transaction_df.empty or overall_df.empty:
                raise ValueError("Missing transaction or overall data")

            # S'assurer que toutes les colonnes nécessaires existent
            required_columns = {
                'transaction_id', 'revenue', 'quantity', 'variation', 
                'device_category', 'item_category2', 'item_name', 
                'item_bundle', 'item_name_simple'
            }
            
            # Ajouter les colonnes manquantes avec des valeurs par défaut
            for col in required_columns:
                if col not in transaction_df.columns:
                    transaction_df[col] = 'N/A'

            # Conversion des colonnes numériques
            numeric_columns = ['revenue', 'quantity']
            for col in numeric_columns:
                if col in transaction_df.columns:
                    transaction_df[col] = pd.to_numeric(transaction_df[col], errors='coerce').fillna(0)

            # Définir les colonnes à concaténer
            concat_columns = ['item_category2', 'item_name', 'item_bundle', 'item_name_simple']
            
            # Créer le dictionnaire d'agrégation
            agg_dict = {
                'revenue': 'sum',
                'quantity': 'sum',
                'variation': 'first',
                'device_category': 'first',
                **{col: lambda x: ' | '.join(sorted(set(str(i) for i in x if pd.notna(i) and str(i).strip()))) 
                   for col in concat_columns}
            }

            # Grouper par transaction_id
            analysis_table = transaction_df.groupby('transaction_id').agg(agg_dict).reset_index()

            # Arrondir les valeurs numériques
            for col in numeric_columns:
                if col in analysis_table.columns:
                    analysis_table[col] = analysis_table[col].round(2)

            return analysis_table

        except Exception as e:
            logger.error(f"Error creating analysis table: {str(e)}")
            raise

    def _convert_numpy_types(self, obj: Any) -> Any:
        """Convertit récursivement les types numpy en types Python standards."""
        if isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_types(item) for item in obj]
        elif isinstance(obj, (np.int64, np.int32)):
            return int(obj)
        elif isinstance(obj, (np.float64, np.float32)):
            return float(obj)
        return obj

    def _calculate_confidence_stats(self, var_data: np.array, ctrl_data: np.array, metric_type: str) -> Tuple[float, float, float]:
        """
        Calcule la confiance statistique et l'intervalle de confiance selon le type de métrique
        
        Args:
            var_data: Données de la variation
            ctrl_data: Données du contrôle
            metric_type: Type de métrique ('rate', 'continuous', 'count')
            
        Returns:
            Tuple[float, float, float]: (confiance, borne inférieure, borne supérieure)
        """
        try:
            if metric_type == 'rate':
                # Test exact de Fisher pour les taux de conversion
                var_success = len(var_data)
                var_total = float(var_overall['users'])
                ctrl_success = len(ctrl_data)
                ctrl_total = float(ctrl_overall['users'])
                
                contingency_table = [
                    [var_success, var_total - var_success],
                    [ctrl_success, ctrl_total - ctrl_success]
                ]
                _, p_value = stats.fisher_exact(contingency_table)
                confidence = (1 - p_value) * 100
                
                # Intervalle de confiance pour la différence de proportions
                var_rate = var_success / var_total
                ctrl_rate = ctrl_success / ctrl_total
                diff = var_rate - ctrl_rate
                
                # Méthode Wilson pour l'intervalle de confiance
                z = 1.96  # 95% confidence
                lower = diff - z * np.sqrt((var_rate * (1-var_rate))/var_total + (ctrl_rate * (1-ctrl_rate))/ctrl_total)
                upper = diff + z * np.sqrt((var_rate * (1-var_rate))/var_total + (ctrl_rate * (1-ctrl_rate))/ctrl_total)
                
            elif metric_type == 'continuous':
                # Test de Mann-Whitney U pour les données continues (AOV, ARPU)
                _, p_value = stats.mannwhitneyu(
                    var_data,
                    ctrl_data,
                    alternative='two-sided'
                )
                confidence = (1 - p_value) * 100

                # Bootstrap pour l'intervalle de confiance
                n_bootstrap = 1000
                diffs = []
                
                for _ in range(n_bootstrap):
                    var_sample = np.random.choice(var_data, size=len(var_data), replace=True)
                    ctrl_sample = np.random.choice(ctrl_data, size=len(ctrl_data), replace=True)
                    diff_pct = ((np.mean(var_sample) - np.mean(ctrl_sample)) / 
                               np.mean(ctrl_sample)) * 100 if np.mean(ctrl_sample) != 0 else 0
                    diffs.append(diff_pct)
                
                lower = np.percentile(diffs, 2.5)
                upper = np.percentile(diffs, 97.5)
                
            else:  # count
                # Test t de Student pour les comptages
                _, p_value = stats.ttest_ind(
                    var_data,
                    ctrl_data,
                    equal_var=False  # Test de Welch
                )
                confidence = (1 - p_value) * 100
                
                # Intervalle de confiance pour la différence de moyennes
                var_mean = np.mean(var_data)
                ctrl_mean = np.mean(ctrl_data)
                diff_pct = ((var_mean - ctrl_mean) / ctrl_mean) * 100 if ctrl_mean != 0 else 0
                
                se = np.sqrt(np.var(var_data)/len(var_data) + np.var(ctrl_data)/len(ctrl_data))
                lower = diff_pct - 1.96 * se
                upper = diff_pct + 1.96 * se

            return round(confidence, 2), round(lower, 2), round(upper, 2)

        except Exception as e:
            logger.error(f"Error calculating confidence stats: {str(e)}")
            return 0.0, 0.0, 0.0

    def _calculate_revenue_metrics(self, var_data: pd.DataFrame, ctrl_data: pd.DataFrame) -> Dict:
        """Calcule les métriques de revenus à partir de la table virtuelle"""
        try:
            # Calculer les revenus totaux
            var_revenue = var_data['revenue'].sum()
            ctrl_revenue = ctrl_data['revenue'].sum()
            
            # Nombre de transactions
            var_transactions = len(var_data)
            ctrl_transactions = len(ctrl_data)
            
            # Calculer le revenu moyen par transaction
            var_avg = var_revenue / var_transactions if var_transactions > 0 else 0
            ctrl_avg = ctrl_revenue / ctrl_transactions if ctrl_transactions > 0 else 0

            # Test de Mann-Whitney U pour la confiance
            _, p_value = stats.mannwhitneyu(
                var_data['revenue'].values,
                ctrl_data['revenue'].values,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100

            # Bootstrap pour l'intervalle de confiance
            n_bootstrap = 1000
            diffs = []
            for _ in range(n_bootstrap):
                var_sample = np.random.choice(var_data['revenue'].values, size=len(var_data), replace=True)
                ctrl_sample = np.random.choice(ctrl_data['revenue'].values, size=len(ctrl_data), replace=True)
                var_mean = np.mean(var_sample)
                ctrl_mean = np.mean(ctrl_sample)
                diff_pct = ((var_mean - ctrl_mean) / ctrl_mean) * 100 if ctrl_mean != 0 else 0
                diffs.append(diff_pct)
            
            lower = np.percentile(diffs, 2.5)
            upper = np.percentile(diffs, 97.5)

            return {
                'value': var_avg,
                'control_value': ctrl_avg,
                'uplift': ((var_avg - ctrl_avg) / ctrl_avg) * 100 if ctrl_avg > 0 else 0,
                'confidence': round(confidence, 2),
                'confidence_interval': {'lower': round(lower, 2), 'upper': round(upper, 2)},
                'details': {
                    'variation': {
                        'count': var_transactions,
                        'total': var_revenue,
                        'rate': round(var_avg, 2),
                        'unit': 'currency'
                    },
                    'control': {
                        'count': ctrl_transactions,
                        'total': ctrl_revenue,
                        'rate': round(ctrl_avg, 2),
                        'unit': 'currency'
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error calculating revenue metrics: {str(e)}")
            return {
                'value': 0,
                'control_value': 0,
                'uplift': 0,
                'confidence': 0,
                'confidence_interval': {'lower': 0, 'upper': 0},
                'details': {
                    'variation': {'count': 0, 'total': 0, 'rate': 0, 'unit': 'currency'},
                    'control': {'count': 0, 'total': 0, 'rate': 0, 'unit': 'currency'}
                }
            }

    def _calculate_add_to_cart_confidence(self, var_adds: float, var_users: float, ctrl_adds: float, ctrl_users: float) -> float:
        """Calcule la confiance statistique pour le taux d'ajout au panier avec le test exact de Fisher"""
        try:
            # Convertir les valeurs en nombres
            var_adds = float(var_adds)
            var_users = float(var_users)
            ctrl_adds = float(ctrl_adds)
            ctrl_users = float(ctrl_users)
            
            # Créer la table de contingence
            contingency_table = [
                [int(var_adds), int(var_users - var_adds)],   # [succès, échecs] variation
                [int(ctrl_adds), int(ctrl_users - ctrl_adds)] # [succès, échecs] contrôle
            ]
            
            # Test exact de Fisher
            _, p_value = stats.fisher_exact(contingency_table)
            confidence = (1 - p_value) * 100
            
            return round(confidence, 2)
        except Exception as e:
            logger.error(f"Error calculating add to cart confidence: {str(e)}")
            return 0.0

    def _calculate_revenue_confidence(self, var_revenue: np.array, ctrl_revenue: np.array) -> float:
        """Calcule la confiance statistique pour le revenu avec le test de Mann-Whitney U"""
        try:
            # Test de Mann-Whitney U
            _, p_value = stats.mannwhitneyu(
                var_revenue,
                ctrl_revenue,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100
            
            return round(confidence, 2)
        except Exception as e:
            logger.error(f"Error calculating revenue confidence: {str(e)}")
            return 0.0

    def _calculate_revenue_confidence_interval(self, var_revenue: np.array, ctrl_revenue: np.array) -> Dict[str, float]:
        """Calcule l'intervalle de confiance pour le revenu total avec bootstrap"""
        try:
            # Bootstrap pour l'intervalle de confiance
            n_bootstrap = 1000
            diffs = []
            
            # Calculer les sommes totales initiales
            var_total = np.sum(var_revenue)
            ctrl_total = np.sum(ctrl_revenue)
            
            # Calculer la différence relative observée
            observed_diff = ((var_total - ctrl_total) / ctrl_total) * 100 if ctrl_total != 0 else 0
            
            for _ in range(n_bootstrap):
                # Échantillonnage avec remplacement
                var_sample = np.random.choice(var_revenue, size=len(var_revenue), replace=True)
                ctrl_sample = np.random.choice(ctrl_revenue, size=len(ctrl_revenue), replace=True)
                
                # Calculer les sommes totales pour chaque échantillon
                var_sum = np.sum(var_sample)
                ctrl_sum = np.sum(ctrl_sample)
                
                # Calculer la différence relative pour cet échantillon
                diff_pct = ((var_sum - ctrl_sum) / ctrl_sum) * 100 if ctrl_sum != 0 else 0
                diffs.append(diff_pct)
            
            # Calculer les percentiles pour l'intervalle de confiance
            lower = np.percentile(diffs, 2.5)  # 2.5ème percentile pour 95% IC
            upper = np.percentile(diffs, 97.5) # 97.5ème percentile pour 95% IC
            
            return {
                'lower': round(lower, 2),
                'upper': round(upper, 2)
            }
        except Exception as e:
            logger.error(f"Error calculating revenue confidence interval: {str(e)}")
            return {'lower': 0, 'upper': 0}

    def _calculate_add_to_cart_confidence_interval(self, var_adds: float, var_users: float, ctrl_adds: float, ctrl_users: float) -> Dict[str, float]:
        """Calcule l'intervalle de confiance pour le taux d'ajout au panier avec la méthode de Wilson"""
        try:
            # Convertir les valeurs en nombres
            var_adds = float(var_adds)
            var_users = float(var_users)
            ctrl_adds = float(ctrl_adds)
            ctrl_users = float(ctrl_users)
            
            # Calculer les proportions
            var_rate = var_adds / var_users
            ctrl_rate = ctrl_adds / ctrl_users
            
            # Calculer la différence relative
            diff = ((var_rate - ctrl_rate) / ctrl_rate) * 100
            
            # Erreur standard pour la différence de proportions
            se = np.sqrt((var_rate * (1 - var_rate)) / var_users + 
                (ctrl_rate * (1 - ctrl_rate)) / ctrl_users)
            
            # Intervalle de confiance à 95% (z = 1.96)
            margin = 1.96 * se * 100  # Convertir en pourcentage
            
            return {
                'lower': round(diff - margin, 2),
                'upper': round(diff + margin, 2)
            }
        except Exception as e:
            logger.error(f"Error calculating add to cart confidence interval: {str(e)}")
            return {'lower': 0, 'upper': 0}

    def _calculate_transaction_rate_confidence_interval(self, var_trans: float, var_users: float, ctrl_trans: float, ctrl_users: float) -> Dict[str, float]:
        """Calcule l'intervalle de confiance pour le taux de transaction avec la méthode de Wilson"""
        try:
            # Convertir les valeurs en nombres
            var_trans = float(var_trans)
            var_users = float(var_users)
            ctrl_trans = float(ctrl_trans)
            ctrl_users = float(ctrl_users)
            
            # Calculer les proportions
            var_rate = var_trans / var_users
            ctrl_rate = ctrl_trans / ctrl_users
            
            # Calculer la différence relative
            diff = ((var_rate - ctrl_rate) / ctrl_rate) * 100
            
            # Erreur standard pour la différence de proportions
            se = np.sqrt((var_rate * (1 - var_rate)) / var_users + 
                (ctrl_rate * (1 - ctrl_rate)) / ctrl_users)
            
            # Intervalle de confiance à 95% (z = 1.96)
            margin = 1.96 * se * 100  # Convertir en pourcentage
            
            return {
                'lower': round(diff - margin, 2),
                'upper': round(diff + margin, 2)
            }
        except Exception as e:
            logger.error(f"Error calculating transaction rate confidence interval: {str(e)}")
            return {'lower': 0, 'upper': 0}

    def _calculate_avg_products_confidence(self, var_data: np.array, ctrl_data: np.array) -> float:
        """Calcule la confiance statistique pour le nombre moyen de produits avec Mann-Whitney U"""
        try:
            # Test de Mann-Whitney U
            _, p_value = stats.mannwhitneyu(
                var_data,
                ctrl_data,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100
            
            return round(confidence, 2)
        except Exception as e:
            logger.error(f"Error calculating avg products confidence: {str(e)}")
            return 0.0

    def _calculate_avg_products_confidence_interval(self, var_data: np.array, ctrl_data: np.array) -> Dict[str, float]:
        """Calcule l'intervalle de confiance pour le nombre moyen de produits avec bootstrap"""
        try:
            n_bootstrap = 1000
            diffs = []
            
            # Moyennes initiales
            var_mean = np.mean(var_data)
            ctrl_mean = np.mean(ctrl_data)
            
            # Différence relative observée
            observed_diff = ((var_mean - ctrl_mean) / ctrl_mean) * 100 if ctrl_mean != 0 else 0
            
            for _ in range(n_bootstrap):
                var_sample = np.random.choice(var_data, size=len(var_data), replace=True)
                ctrl_sample = np.random.choice(ctrl_data, size=len(ctrl_data), replace=True)
                
                var_sample_mean = np.mean(var_sample)
                ctrl_sample_mean = np.mean(ctrl_sample)
                
                diff_pct = ((var_sample_mean - ctrl_sample_mean) / ctrl_sample_mean) * 100 if ctrl_sample_mean != 0 else 0
                diffs.append(diff_pct)
            
            lower = np.percentile(diffs, 2.5)
            upper = np.percentile(diffs, 97.5)
            
            return {
                'lower': round(lower, 2),
                'upper': round(upper, 2)
            }
        except Exception as e:
            logger.error(f"Error calculating avg products confidence interval: {str(e)}")
            return {'lower': 0, 'upper': 0}

    def calculate_revenue_distribution_stats(self, var_data: pd.DataFrame, ctrl_data: pd.DataFrame, range_info: Dict) -> Dict:
        """Calcule les statistiques pour la distribution des revenus"""
        try:
            # Filtrer les données pour ce range
            var_in_range = var_data[(var_data['revenue'] >= range_info['min']) & (var_data['revenue'] <= range_info['max'])]
            ctrl_in_range = ctrl_data[(ctrl_data['revenue'] >= range_info['min']) & (ctrl_data['revenue'] <= range_info['max'])]
            
            # Calculer les taux
            var_rate = (len(var_in_range) / len(var_data)) * 100 if len(var_data) > 0 else 0
            ctrl_rate = (len(ctrl_in_range) / len(ctrl_data)) * 100 if len(ctrl_data) > 0 else 0

            # Test de Mann-Whitney U pour la confiance
            _, p_value = stats.mannwhitneyu(
                var_data['revenue'].values,
                ctrl_data['revenue'].values,
                alternative='two-sided'
            )
            confidence = (1 - p_value) * 100

            # Calculer l'intervalle de confiance avec la méthode de Wilson
            # Calculer les proportions
            var_p = len(var_in_range) / len(var_data) if len(var_data) > 0 else 0
            ctrl_p = len(ctrl_in_range) / len(ctrl_data) if len(ctrl_data) > 0 else 0
            
            # Erreur standard pour la différence de proportions
            se = np.sqrt((var_p * (1 - var_p)) / len(var_data) + 
                        (ctrl_p * (1 - ctrl_p)) / len(ctrl_data))
            
            # Intervalle de confiance à 95% (z = 1.96)
            z = 1.96
            margin = z * se * 100  # Convertir en pourcentage
            
            # Différence relative
            diff = ((var_rate - ctrl_rate) / ctrl_rate) * 100 if ctrl_rate > 0 else 0

            return {
                'value': var_rate,
                'control_value': ctrl_rate,
                'uplift': diff,
                'confidence': round(confidence, 2),
                'confidence_interval': {
                    'lower': round(diff - margin, 2),
                    'upper': round(diff + margin, 2)
                },
                'details': {
                    'variation': {
                        'count': len(var_in_range),
                        'total': len(var_data),
                        'rate': round(var_rate, 2),
                        'unit': 'percentage'
                    },
                    'control': {
                        'count': len(ctrl_in_range),
                        'total': len(ctrl_data),
                        'rate': round(ctrl_rate, 2),
                        'unit': 'percentage'
                    }
                }
            }
        except Exception as e:
            logger.error(f"Error calculating revenue distribution stats: {str(e)}")
            return self._get_default_metric_result()

    def _get_default_metric_result(self) -> Dict:
        """Retourne un dictionnaire par défaut pour les métriques en cas d'erreur."""
        return {
            'value': 0,
            'control_value': 0,
            'uplift': 0,
            'confidence': 0,
            'confidence_interval': {'lower': 0, 'upper': 0},
            'details': {
                'variation': {'count': 0, 'total': 0, 'rate': 0, 'unit': 'percentage'},
                'control': {'count': 0, 'total': 0, 'rate': 0, 'unit': 'percentage'}
            }
        }